import { Injectable, signal, computed, inject } from '@angular/core';

import { AutomationApiService } from '../infrastructure/automation-api.service';

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

  }



  setViewMode(mode: ViewMode): void {

    this.viewMode.set(mode);

  }



  toggleRule(id: string): void {

    this.businessRules.update(rules => rules.map(rule => (rule.id === id ? rule.toggle() : rule)));

    this.api.toggleRule(id).subscribe();

    this.rebuildTimeline();

  }



  addBusinessRule(name: string, description: string, group: string): AutomationRule {

    const id = `rule-${Date.now()}`;

    const rule = new AutomationRule(

      id,

      name.trim(),

      description.trim() || 'Custom facility automation scenario.',

      'auto_awesome',

      true,

      group.trim() || 'Custom Group',

      'ACTIVE',

      {

        startHour: 8,

        endHour: 18,

        label: name.trim(),

        color: '#4263eb',

      },

    );



    this.businessRules.update(rules => [...rules, rule]);

    this.rebuildTimeline();

    this.selectedTimelineSlotId.set(id);

    return rule;

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

  readonly inactivityAutoOffEnabled = signal<boolean>(this.readInactivityEnabled());

  readonly inactivityMinutes = signal<number>(this.readInactivityMinutes());

  toggleInactivityAutoOff(enabled: boolean): void {
    this.inactivityAutoOffEnabled.set(enabled);
    localStorage.setItem('domoticore-inactivity-enabled', enabled ? '1' : '0');
  }

  setInactivityMinutes(minutes: number): void {
    const safe = Math.min(180, Math.max(5, minutes));
    this.inactivityMinutes.set(safe);
    localStorage.setItem('domoticore-inactivity-minutes', String(safe));
  }

  private readInactivityEnabled(): boolean {
    return localStorage.getItem('domoticore-inactivity-enabled') === '1';
  }

  private readInactivityMinutes(): number {
    const raw = Number(localStorage.getItem('domoticore-inactivity-minutes'));
    return Number.isFinite(raw) ? raw : 30;
  }

}


