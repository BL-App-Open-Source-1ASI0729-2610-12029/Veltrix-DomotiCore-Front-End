import { Injectable, signal, computed, inject } from '@angular/core';

import { AutomationApiService } from '../infrastructure/automation-api.service';
import { AutomationAssembler } from '../infrastructure/automation-assembler';

import { AutomationRule } from '../domain/model/automation-rule.entity';

import { ShutdownProtocol } from '../domain/model/shutdown-protocol.entity';

import {

  GroupScheduleResponse,

  EfficiencyInsightResponse,

  ActiveRuleTimelineResponse,

  ActiveSceneResponse,

  UpcomingEventResponse,

  SmartSuggestionResponse,

  TimelineSlotResponse,

} from '../infrastructure/automation-response';

import {

  TimelineFilter,

  TimelineZoomMode,

  formatDecimalHour,

  layoutTimelineSlots,

} from './timeline-layout.util';



export type ViewMode = 'list' | 'grid';



const TIMELINE_END_HOUR = 22;



@Injectable({ providedIn: 'root' })

export class AutomationStore {

  private readonly api = inject(AutomationApiService);

  private clockIntervalId: ReturnType<typeof setInterval> | null = null;



  readonly businessRules = signal<AutomationRule[]>([]);

  readonly shutdownProtocol = signal<ShutdownProtocol | null>(null);

  readonly groupSchedules = signal<GroupScheduleResponse[]>([]);

  readonly efficiencyInsights = signal<EfficiencyInsightResponse | null>(null);

  readonly activeTimeline = signal<ActiveRuleTimelineResponse | null>(null);

  readonly activeScenes = signal<ActiveSceneResponse[]>([]);

  readonly upcomingEvents = signal<UpcomingEventResponse[]>([]);

  readonly smartSuggestion = signal<SmartSuggestionResponse | null>(null);

  readonly viewMode = signal<ViewMode>('grid');

  readonly loading = signal<boolean>(false);

  readonly searchQuery = signal<string>('');

  readonly selectedTimelineSlotId = signal<string | null>(null);

  readonly timelineZoom = signal<TimelineZoomMode>('business');

  readonly timelineFilter = signal<TimelineFilter>('all');



  readonly activeRulesCount = computed(() =>

    this.businessRules().filter(r => r.isActive()).length,

  );



  readonly selectedTimelineSlot = computed(() => {

    const timeline = this.activeTimeline();

    const selectedId = this.selectedTimelineSlotId();

    if (!timeline || !selectedId) return null;

    return timeline.slots.find(slot => slot.id === selectedId) ?? null;

  });



  loadAll(): void {

    this.loading.set(true);

    this.startTimelineClock();



    this.api.getBusinessRules().subscribe(rules => {

      this.businessRules.set(rules);

      this.rebuildTimeline();

      this.loading.set(false);

    });



    this.api.getShutdownProtocol().subscribe(protocol => {

      this.shutdownProtocol.set(protocol);

      this.rebuildTimeline();

    });



    this.api.getGroupSchedules().subscribe(schedules => this.groupSchedules.set(schedules));

    this.api.getEfficiencyInsights().subscribe(insights => this.efficiencyInsights.set(insights));

    this.api.getActiveScenes().subscribe(scenes => this.activeScenes.set(scenes));

    this.api.getUpcomingEvents().subscribe(events => this.upcomingEvents.set(events));

    this.api.getSmartSuggestion().subscribe(suggestion => this.smartSuggestion.set(suggestion));

    this.api.getHomePreferences().subscribe(prefs => {
      this.inactivityAutoOffEnabled.set(prefs.inactivityAutoOffEnabled);
      this.inactivityMinutes.set(prefs.inactivityMinutes);
    });
  }



  setSearchQuery(query: string): void {

    this.searchQuery.set(query);

  }



  selectTimelineSlot(id: string | null): void {

    this.selectedTimelineSlotId.set(id);

  }



  setTimelineZoom(mode: TimelineZoomMode): void {

    this.timelineZoom.set(mode);

  }



  setTimelineFilter(filter: TimelineFilter): void {

    this.timelineFilter.set(filter);

  }



  toggleScene(id: string): void {

    this.activeScenes.update(scenes =>

      scenes.map(scene => (scene.id === id ? { ...scene, active: !scene.active } : scene)),

    );

    this.api.toggleScene(id).subscribe();

  }



  toggleUpcomingEvent(id: string): void {

    this.upcomingEvents.update(events =>

      events.map(event => (event.id === id ? { ...event, active: !event.active } : event)),

    );

    this.api.toggleUpcomingEvent(id).subscribe();

  }



  dismissSuggestion(): void {

    this.smartSuggestion.update(suggestion => (suggestion ? { ...suggestion, visible: false } : suggestion));

    this.api.dismissSmartSuggestion().subscribe();

  }



  setViewMode(mode: ViewMode): void {

    this.viewMode.set(mode);

  }



  toggleRule(id: string): void {

    this.businessRules.update(rules => rules.map(rule => (rule.id === id ? rule.toggle() : rule)));

    this.api.toggleRule(id).subscribe();

    this.rebuildTimeline();

  }



  addBusinessRule(
    name: string,
    description: string,
    group: string,
    startHour = 8,
    endHour = 18,
  ): AutomationRule {
    const trimmedName = name.trim();
    const safeStart = Math.min(23, Math.max(0, startHour));
    const safeEnd = Math.min(24, Math.max(safeStart + 1, endHour));

    const payload = {
      name: trimmedName,
      description: description.trim() || 'Custom facility automation scenario.',
      group: group.trim() || 'Custom Group',
      icon: 'auto_awesome',
      active: true,
      status: 'ACTIVE' as const,
      timeline: { startHour: safeStart, endHour: safeEnd, label: trimmedName, color: '#4263eb' },
    };

    const tempId = `rule-${Date.now()}`;
    const optimisticRule = new AutomationRule(
      tempId,
      payload.name,
      payload.description,
      payload.icon,
      true,
      payload.group,
      'ACTIVE',
      {
        startHour: safeStart,
        endHour: safeEnd,
        label: trimmedName,
        color: '#4263eb',
      },
    );

    this.businessRules.update(rules => [...rules, optimisticRule]);
    this.rebuildTimeline();
    this.selectedTimelineSlotId.set(tempId);

    this.api.createRule(payload).subscribe(dto => {
      const rule = AutomationAssembler.toAutomationRule(dto);
      this.businessRules.update(rules => rules.map(existing => (existing.id === tempId ? rule : existing)));
      this.rebuildTimeline();
      this.selectedTimelineSlotId.set(rule.id);
    });

    return optimisticRule;
  }



  toggleShutdownStep(stepId: string): void {

    this.shutdownProtocol.update(protocol => {

      if (!protocol) return protocol;



      return new ShutdownProtocol(

        protocol.id,

        protocol.name,

        protocol.description,

        protocol.triggersInMinutes,

        protocol.steps.map(step =>

          step.id === stepId ? { ...step, disabled: !step.disabled } : step,

        ),

      );

    });

    this.rebuildTimeline();
    this.api.toggleShutdownStep(stepId).subscribe();

  }

  saveShutdownProtocol(): void {
    const protocol = this.shutdownProtocol();
    if (!protocol) return;

    this.rebuildTimeline();
    this.api.saveShutdownProtocol({
      id: protocol.id,
      name: protocol.name,
      description: protocol.description,
      triggersInMinutes: protocol.triggersInMinutes,
      steps: protocol.steps.map(step => ({
        id: step.id,
        label: step.label,
        icon: step.icon,
        disabled: step.disabled,
        labelKey: step.labelKey,
      })),
    }).subscribe();
  }



  postponeShutdown(minutes: number): void {

    this.shutdownProtocol.update(protocol => {

      if (!protocol) return protocol;



      return new ShutdownProtocol(

        protocol.id,

        protocol.name,

        protocol.description,

        protocol.triggersInMinutes + minutes,

        protocol.steps,

      );

    });

    this.rebuildTimeline();

  }



  private startTimelineClock(): void {

    if (this.clockIntervalId) return;



    this.clockIntervalId = setInterval(() => this.rebuildTimeline(), 30_000);

  }



  private rebuildTimeline(): void {

    const now = new Date();

    const currentDecimal = now.getHours() + now.getMinutes() / 60;

    const currentTime = formatDecimalHour(currentDecimal);

    const activeRules = this.businessRules().filter(rule => rule.active);

    const protocol = this.shutdownProtocol();



    const slots: TimelineSlotResponse[] = activeRules.map(rule => {

      const isRunningNow = currentDecimal >= rule.timeline.startHour && currentDecimal < rule.timeline.endHour;

      const duration = rule.timeline.endHour - rule.timeline.startHour;

      const progressPercent = isRunningNow && duration > 0

        ? Math.min(100, Math.max(0, ((currentDecimal - rule.timeline.startHour) / duration) * 100))

        : 0;

      const endsInMinutes = isRunningNow

        ? Math.max(0, Math.round((rule.timeline.endHour - currentDecimal) * 60))

        : undefined;



      return {

        id: rule.id,

        ruleId: rule.id,

        label: rule.timeline.label,

        startHour: rule.timeline.startHour,

        endHour: rule.timeline.endHour,

        color: rule.timeline.color,

        category: 'operational',

        style: 'solid',

        group: rule.group,

        description: rule.description,

        isRunningNow,

        progressPercent,

        endsInMinutes,

      };

    });



    if (protocol) {

      const shutdownStart = currentDecimal + protocol.triggersInMinutes / 60;



      slots.push({

        id: 'closing-time',

        label: `${protocol.name} Protocol`,

        startHour: shutdownStart,

        endHour: TIMELINE_END_HOUR,

        color: '#e8590c',

        isAlert: true,

        category: 'security',

        style: 'solid',

        group: 'Facility Security',

        description: protocol.description,

        isRunningNow: false,

        endsInMinutes: protocol.triggersInMinutes,

      });

      slots.push({

        id: 'perimeter-lockdown',

        label: 'Perimeter Lockdown (Group)',

        startHour: currentDecimal,

        endHour: TIMELINE_END_HOUR,

        color: '#c92a2a',

        isAlert: true,

        category: 'security',

        style: 'dashed',

        group: 'Perimeter',

        description: 'Automated lockdown sequence for all external access points.',

        isRunningNow: true,

        progressPercent: 8,

      });

    }



    const layoutedSlots = layoutTimelineSlots(slots);

    const runningNowCount = layoutedSlots.filter(slot => slot.isRunningNow).length;

    const conflictCount = new Set(

      layoutedSlots.filter(slot => slot.hasConflict).map(slot => slot.id),

    ).size;



    this.activeTimeline.set({

      currentTime,

      currentDecimal,

      activeCount: activeRules.length + (protocol ? 2 : 0),

      runningNowCount,

      conflictCount,

      slots: layoutedSlots,

    });

  }

  readonly inactivityAutoOffEnabled = signal<boolean>(false);

  readonly inactivityMinutes = signal<number>(30);

  toggleInactivityAutoOff(enabled: boolean): void {
    this.inactivityAutoOffEnabled.set(enabled);
    this.api.patchHomePreferences({ inactivityAutoOffEnabled: enabled }).subscribe();
  }

  setInactivityMinutes(minutes: number): void {
    const safe = Math.min(180, Math.max(5, minutes));
    this.inactivityMinutes.set(safe);
    this.api.patchHomePreferences({ inactivityMinutes: safe }).subscribe();
  }

}


