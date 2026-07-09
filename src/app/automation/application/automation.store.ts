import { Injectable, signal, computed, inject } from '@angular/core';
import { forkJoin, of, Observable, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { AutomationApiService } from '../infrastructure/automation-api.service';
import { AutomationAssembler } from '../infrastructure/automation-assembler';

import { AutomationRule } from '../domain/model/automation-rule.entity';

import { ShutdownProtocol, ShutdownStep } from '../domain/model/shutdown-protocol.entity';

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
const TIMELINE_SELECTION_KEY = 'domoticore-timeline-selection';



@Injectable({ providedIn: 'root' })

export class AutomationStore {

  private readonly api = inject(AutomationApiService);

  private clockIntervalId: ReturnType<typeof setInterval> | null = null;
  private apiTimelineSlots: TimelineSlotResponse[] = [];
  private readonly timelinePaused = signal(false);
  private centerDataLoaded = false;



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
  readonly loadError = signal<boolean>(false);

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
    if (!selectedId) {
      return null;
    }

    const slot = timeline?.slots.find(
      item => item.id === selectedId || item.ruleId === selectedId,
    );
    if (slot) {
      return slot;
    }

    const rule = this.businessRules().find(item => item.id === selectedId);
    if (!rule) {
      return null;
    }

    const currentDecimal = timeline?.currentDecimal ?? new Date().getHours();
    return this.ruleToTimelineSlot(rule, currentDecimal);
  });



  loadAll(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.startTimelineClock();
    this.primeTimelineSelectionFromStorage();

    forkJoin({
      rules: this.api.getBusinessRules().pipe(catchError(() => of([] as AutomationRule[]))),
      protocol: this.api.getShutdownProtocol().pipe(catchError(() => of(null))),
      schedules: this.api.getGroupSchedules().pipe(catchError(() => of([] as GroupScheduleResponse[]))),
      insights: this.api.getEfficiencyInsights().pipe(catchError(() => of(null))),
      timeline: this.api.getActiveRuleTimeline().pipe(catchError(() => of(null))),
      scenes: this.api.getActiveScenes().pipe(catchError(() => of([] as ActiveSceneResponse[]))),
      events: this.api.getUpcomingEvents().pipe(catchError(() => of([] as UpcomingEventResponse[]))),
      suggestion: this.api.getSmartSuggestion().pipe(catchError(() => of(null))),
      prefs: this.api.getHomePreferences().pipe(
        catchError(() => of({ inactivityAutoOffEnabled: false, inactivityMinutes: 30 })),
      ),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: result => {
          this.businessRules.set(result.rules);
          this.shutdownProtocol.set(result.protocol);
          this.groupSchedules.set(result.schedules);
          this.efficiencyInsights.set(result.insights);
          this.activeScenes.set(result.scenes);
          this.upcomingEvents.set(result.events);
          this.smartSuggestion.set(result.suggestion);
          this.inactivityAutoOffEnabled.set(result.prefs.inactivityAutoOffEnabled);
          this.inactivityMinutes.set(result.prefs.inactivityMinutes);
          this.apiTimelineSlots = this.normalizeApiTimelineSlots(result.timeline?.slots ?? []);
          this.rebuildTimeline();
          this.centerDataLoaded = true;
        },
        error: () => {
          this.loadError.set(true);
          this.rebuildTimeline();
          this.centerDataLoaded = true;
        },
      });
  }

  bootstrapCenter(): void {
    this.primeTimelineSelectionFromStorage();

    if (this.centerDataLoaded) {
      this.rebuildTimeline();
      this.restoreTimelineSelection();
      return;
    }

    this.loadAll();
  }

  primeTimelineSelectionFromStorage(): void {
    const remembered = sessionStorage.getItem(TIMELINE_SELECTION_KEY);
    if (remembered) {
      this.selectedTimelineSlotId.set(remembered);
    }
  }

  setTimelinePaused(paused: boolean): void {
    this.timelinePaused.set(paused);
  }



  setSearchQuery(query: string): void {

    this.searchQuery.set(query);

  }



  selectTimelineSlot(id: string | null): void {
    this.selectedTimelineSlotId.set(id);
  }

  rememberTimelineSelection(slotId?: string | null): void {
    const id = slotId ?? this.selectedTimelineSlotId();
    if (!id) {
      return;
    }
    this.selectedTimelineSlotId.set(id);
    sessionStorage.setItem(TIMELINE_SELECTION_KEY, id);
  }

  consumePendingTimelineRestore(): string | null {
    return sessionStorage.getItem(TIMELINE_SELECTION_KEY);
  }

  private restoreTimelineSelection(): void {
    const remembered = sessionStorage.getItem(TIMELINE_SELECTION_KEY);
    const candidate = remembered ?? this.selectedTimelineSlotId();
    if (!candidate) {
      return;
    }

    const timeline = this.activeTimeline();
    const matchedSlot = timeline?.slots.find(
      slot => slot.id === candidate || slot.ruleId === candidate,
    );

    if (matchedSlot) {
      this.selectedTimelineSlotId.set(matchedSlot.id);
      sessionStorage.removeItem(TIMELINE_SELECTION_KEY);
      return;
    }

    this.selectedTimelineSlotId.set(candidate);
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

  updateRuleSchedule(
    ruleId: string,
    startHour: number,
    endHour: number,
    group?: string,
  ): Observable<AutomationRule> {
    const current = this.businessRules().find(rule => rule.id === ruleId);
    if (!current) {
      return throwError(() => new Error(`Rule not found: ${ruleId}`));
    }

    const safeStart = Math.min(23, Math.max(0, startHour));
    const safeEnd = Math.min(24, Math.max(safeStart + 1, endHour));
    const optimistic = current.withSchedule(safeStart, safeEnd, group);

    this.businessRules.update(rules =>
      rules.map(rule => (rule.id === ruleId ? optimistic : rule)),
    );
    this.selectedTimelineSlotId.set(ruleId);
    this.rebuildTimeline();

    return this.api
      .updateRule(ruleId, {
        group: optimistic.group,
        timeline: {
          startHour: safeStart,
          endHour: safeEnd,
          label: optimistic.timeline.label,
          color: optimistic.timeline.color,
        },
      })
      .pipe(
        tap(rule => {
          this.businessRules.update(rules =>
            rules.map(existing => (existing.id === ruleId ? rule : existing)),
          );
          this.selectedTimelineSlotId.set(ruleId);
          this.rebuildTimeline();
        }),
      );
  }



  saveShutdownProtocol(steps: ShutdownStep[]): Observable<void> {
    const protocol = this.shutdownProtocol();
    if (!protocol) {
      return of(void 0);
    }

    const updated = new ShutdownProtocol(
      protocol.id,
      protocol.name,
      protocol.description,
      protocol.triggersInMinutes,
      steps,
    );
    this.shutdownProtocol.set(updated);
    this.rebuildTimeline();

    return this.api
      .saveShutdownProtocol({
        id: protocol.id,
        name: protocol.name,
        description: protocol.description,
        triggersInMinutes: protocol.triggersInMinutes,
        steps: steps.map(step => ({
          id: step.id,
          label: step.label,
          icon: step.icon,
          disabled: step.disabled,
          labelKey: step.labelKey,
        })),
      })
      .pipe(
        tap(response => this.shutdownProtocol.set(AutomationAssembler.toShutdownProtocol(response))),
        map(() => void 0),
      );
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



    this.clockIntervalId = setInterval(() => {
      if (!this.timelinePaused()) {
        this.rebuildTimeline();
      }
    }, 30_000);
  }



  private rebuildTimeline(): void {

    const now = new Date();

    const currentDecimal = now.getHours() + now.getMinutes() / 60;

    const currentTime = formatDecimalHour(currentDecimal);

    const activeRules = this.rulesForTimeline(currentDecimal);

    const protocol = this.shutdownProtocol();



    const slots: TimelineSlotResponse[] = activeRules.map(rule => {

      const isRunningNow =
        rule.active &&
        currentDecimal >= rule.timeline.startHour &&
        currentDecimal < rule.timeline.endHour;

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
    }

    const mergedSlots = this.mergeTimelineSlots(slots, this.apiTimelineSlots);
    const layoutedSlots = layoutTimelineSlots(mergedSlots);

    const runningNowCount = layoutedSlots.filter(slot => slot.isRunningNow).length;

    const conflictCount = new Set(

      layoutedSlots.filter(slot => slot.hasConflict).map(slot => slot.id),

    ).size;



    this.activeTimeline.set({

      currentTime,

      currentDecimal,

      activeCount: layoutedSlots.length,

      runningNowCount,

      conflictCount,

      slots: layoutedSlots,

    });

    this.restoreTimelineSelection();
  }

  private rulesForTimeline(currentDecimal: number): AutomationRule[] {
    const activeRules = this.businessRules().filter(rule => rule.active);
    const restoreId =
      this.selectedTimelineSlotId() ?? sessionStorage.getItem(TIMELINE_SELECTION_KEY);
    if (!restoreId) {
      return activeRules;
    }

    const selectedRule = this.businessRules().find(rule => rule.id === restoreId);
    if (!selectedRule || selectedRule.active) {
      return activeRules;
    }
    if (activeRules.some(rule => rule.id === selectedRule.id)) {
      return activeRules;
    }
    return [...activeRules, selectedRule];
  }

  private ruleToTimelineSlot(rule: AutomationRule, currentDecimal: number): TimelineSlotResponse {
    const isRunningNow =
      rule.active &&
      currentDecimal >= rule.timeline.startHour &&
      currentDecimal < rule.timeline.endHour;
    const duration = rule.timeline.endHour - rule.timeline.startHour;
    const progressPercent =
      isRunningNow && duration > 0
        ? Math.min(100, Math.max(0, ((currentDecimal - rule.timeline.startHour) / duration) * 100))
        : 0;

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
    };
  }

  private normalizeApiTimelineSlots(slots: TimelineSlotResponse[]): TimelineSlotResponse[] {
    return slots.map(slot => ({
      ...slot,
      category: slot.category === 'security' ? 'security' : 'operational',
      style: slot.style ?? 'solid',
      color: slot.color ?? (slot.category === 'security' ? '#c92a2a' : '#4263eb'),
    }));
  }

  private mergeTimelineSlots(
    clientSlots: TimelineSlotResponse[],
    apiSlots: TimelineSlotResponse[],
  ): TimelineSlotResponse[] {
    if (!apiSlots.length) {
      return clientSlots;
    }

    const merged = [...clientSlots];
    const existingIds = new Set(clientSlots.map(slot => slot.id));

    for (const slot of apiSlots) {
      if (existingIds.has(slot.id)) {
        const index = merged.findIndex(item => item.id === slot.id);
        if (index >= 0) {
          merged[index] = { ...merged[index], ...slot };
        }
        continue;
      }
      merged.push(slot);
    }

    return merged;
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


