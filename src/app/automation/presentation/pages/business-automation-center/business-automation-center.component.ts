import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AutomationStore } from '../../../application/automation.store';

import { AutomationRule } from '../../../domain/model/automation-rule.entity';
import { ShutdownStep } from '../../../domain/model/shutdown-protocol.entity';

import { TimelineSlotResponse } from '../../../infrastructure/automation-response';

import {

  TimelineFilter,

  TimelineRange,

  TimelineZoomMode,

  filterTimelineSlots,

  formatDecimalHour,

  getMaxStackIndex,

  getTimelineGridHours,

  getTimelineHours,

  getTimelineRange,

} from '../../../application/timeline-layout.util';

import { BusinessAutomationNavComponent } from '../../components/business-automation-nav/business-automation-nav.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';

import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';



const SLOT_HEIGHT = 28;

const SLOT_GAP = 6;

const OPERATIONAL_TOP = 8;

const ZONE_GAP = 8;

const TRACK_BOTTOM_PADDING = 10;



@Component({

  selector: 'app-business-automation-center',

  standalone: true,

  imports: [CommonModule, FormsModule, TranslateModule, BusinessAutomationNavComponent, ...MATERIAL_IMPORTS],

  templateUrl: './business-automation-center.component.html',

  styleUrl: './business-automation-center.component.css',

})

export class BusinessAutomationCenterComponent implements OnInit {

  readonly store = inject(AutomationStore);

  readonly icons = GOOGLE_ICONS;



  private readonly feedback = inject(UiFeedbackService);

  private readonly translate = inject(TranslateService);

  private readonly router = inject(Router);



  readonly showNewRuleModal = signal(false);
  readonly showShutdownModal = signal(false);
  readonly showScheduleEditModal = signal(false);
  readonly savingShutdown = signal(false);
  readonly savingSchedule = signal(false);
  readonly hoveredSlotId = signal<string | null>(null);
  readonly shutdownStepDraft = signal<ShutdownStep[]>([]);

  editScheduleRuleId = '';
  editScheduleGroup = '';
  editScheduleStartHour = 8;
  editScheduleEndHour = 18;



  newRuleName = '';

  newRuleDescription = '';

  newRuleGroup = 'Whole Building';

  newRuleStartHour = 8;

  newRuleEndHour = 18;



  readonly allTimelineSlots = computed(() => this.store.activeTimeline()?.slots ?? []);

  readonly timelineRange = computed<TimelineRange>(() => {

    const timeline = this.store.activeTimeline();

    const currentDecimal = timeline?.currentDecimal ?? new Date().getHours();

    return getTimelineRange(this.store.timelineZoom(), currentDecimal);

  });



  readonly timelineHours = computed(() => getTimelineHours(this.timelineRange()));

  readonly timelineGridHours = computed(() => getTimelineGridHours(this.timelineRange()));



  readonly visibleTimelineSlots = computed(() => {

    const timeline = this.store.activeTimeline();

    if (!timeline) return [];



    return filterTimelineSlots(timeline.slots, this.store.timelineFilter());

  });

  readonly operationalZoneBottom = computed(() => {
    const slots = this.allTimelineSlots().filter(slot => slot.category === 'operational');
    const stacks = getMaxStackIndex(slots, 'operational');
    return OPERATIONAL_TOP + (stacks + 1) * (SLOT_HEIGHT + SLOT_GAP);
  });

  readonly timelineTrackHeight = computed(() => {
    const slots = this.allTimelineSlots();
    const securityStacks = getMaxStackIndex(
      slots.filter(slot => slot.category === 'security'),
      'security',
    );
    const operationalBottom = this.operationalZoneBottom();
    const securityBottom = securityStacks >= 0
      ? operationalBottom + ZONE_GAP + (securityStacks + 1) * (SLOT_HEIGHT + SLOT_GAP)
      : operationalBottom;

    return Math.max(96, securityBottom + TRACK_BOTTOM_PADDING);
  });



  readonly filteredRules = computed(() => {

    const query = this.store.searchQuery().trim().toLowerCase();

    const rules = this.store.businessRules();

    if (!query) return rules;



    return rules.filter(

      rule =>

        rule.name.toLowerCase().includes(query) ||

        rule.description.toLowerCase().includes(query) ||

        rule.group.toLowerCase().includes(query) ||

        rule.timeline.label.toLowerCase().includes(query),

    );

  });



  ngOnInit(): void {
    this.store.loadAll();
  }

  editingScheduleRule(): AutomationRule | null {
    if (!this.editScheduleRuleId) return null;
    return this.store.businessRules().find(rule => rule.id === this.editScheduleRuleId) ?? null;
  }



  onSearch(event: Event): void {

    this.store.setSearchQuery((event.target as HTMLInputElement).value);

  }



  getRuleIcon(icon: string): string {

    const map: Record<string, string> = {

      visibility_off: GOOGLE_ICONS.visibilityOff,

      ac_unit: GOOGLE_ICONS.acUnit,

      lightbulb: GOOGLE_ICONS.lightbulb,

      thermostat: GOOGLE_ICONS.thermostat,

      lock: GOOGLE_ICONS.lock,

      power_settings_new: GOOGLE_ICONS.powerSettings,

      dns: GOOGLE_ICONS.dns,

      auto_awesome: GOOGLE_ICONS.autoAwesome,

    };

    return map[icon] ?? GOOGLE_ICONS.autoAwesome;

  }



  getStepIcon(icon: string): string {

    return this.getRuleIcon(icon);

  }



  slotLeft(startHour: number): number {
    const range = this.timelineRange();
    const span = range.end - range.start;
    const clampedStart = Math.max(startHour, range.start);
    const left = ((clampedStart - range.start) / span) * 100;
    return Math.max(0, Math.min(100, left));
  }

  slotWidth(startHour: number, endHour: number): number {
    const range = this.timelineRange();
    const span = range.end - range.start;
    const clampedStart = Math.max(startHour, range.start);
    const clampedEnd = Math.min(endHour, range.end);
    const left = this.slotLeft(startHour);
    const width = ((clampedEnd - clampedStart) / span) * 100;
    return Math.max(0, Math.min(100 - left, width));
  }



  slotTop(slot: TimelineSlotResponse): number {
    const stackIndex = slot.stackIndex ?? 0;

    if (slot.category === 'security') {
      return this.operationalZoneBottom() + ZONE_GAP + stackIndex * (SLOT_HEIGHT + SLOT_GAP);
    }

    return OPERATIONAL_TOP + stackIndex * (SLOT_HEIGHT + SLOT_GAP);
  }

  hasSecuritySlots(): boolean {
    return this.allTimelineSlots().some(slot => slot.category === 'security');
  }



  slotHeight(): number {

    return SLOT_HEIGHT;

  }



  currentTimeLeft(currentDecimal: number): number {
    const range = this.timelineRange();
    const left = ((currentDecimal - range.start) / (range.end - range.start)) * 100;
    return Math.max(0, Math.min(100, left));
  }



  gridLineLeft(hour: number): number {

    const range = this.timelineRange();

    return ((hour - range.start) / (range.end - range.start)) * 100;

  }



  formatHour(hour: number): string {

    return `${String(hour).padStart(2, '0')}:00`;

  }



  formatSlotRange(slot: TimelineSlotResponse): string {

    return `${formatDecimalHour(slot.startHour)} – ${formatDecimalHour(slot.endHour)}`;

  }



  isSlotSelected(slot: TimelineSlotResponse): boolean {

    return this.store.selectedTimelineSlotId() === slot.id;

  }



  isRuleHighlighted(rule: AutomationRule): boolean {

    return this.store.selectedTimelineSlotId() === rule.id;

  }



  isSlotHovered(slot: TimelineSlotResponse): boolean {

    return this.hoveredSlotId() === slot.id;

  }



  onTimelineSlotHover(slot: TimelineSlotResponse | null): void {

    this.hoveredSlotId.set(slot?.id ?? null);

  }



  onTimelineSlotClick(slot: TimelineSlotResponse): void {
    this.store.selectTimelineSlot(slot.id);

    if (slot.ruleId) {
      window.setTimeout(() => {
        document.getElementById(`rule-${slot.ruleId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 80);
    }
  }

  slotTooltip(slot: TimelineSlotResponse): string {
    const range = this.formatSlotRange(slot);
    const status = this.translate.instant(this.slotStatusKey(slot));
    return `${slot.label} · ${range} · ${status}`;
  }



  onTimelineZoomChange(mode: TimelineZoomMode): void {

    this.store.setTimelineZoom(mode);

  }



  onTimelineFilterChange(filter: TimelineFilter): void {

    this.store.setTimelineFilter(filter);

  }



  clearTimelineSelection(): void {

    this.store.selectTimelineSlot(null);

  }



  onViewSelectedRule(): void {

    const slot = this.store.selectedTimelineSlot();

    if (!slot?.ruleId) return;



    document.getElementById(`rule-${slot.ruleId}`)?.scrollIntoView({

      behavior: 'smooth',

      block: 'center',

    });

  }



  onEditSelectedSchedule(): void {
    const slot = this.store.selectedTimelineSlot();
    if (!slot) return;

    if (slot.ruleId) {
      const rule = this.store.businessRules().find(item => item.id === slot.ruleId);
      if (!rule) return;

      this.editScheduleRuleId = rule.id;
      this.editScheduleGroup = rule.group;
      this.editScheduleStartHour = rule.timeline.startHour;
      this.editScheduleEndHour = rule.timeline.endHour;
      this.store.setTimelinePaused(true);
      this.showScheduleEditModal.set(true);
      return;
    }

    this.onEditShutdownProtocol();
  }

  closeScheduleEditModal(): void {
    this.showScheduleEditModal.set(false);
    this.savingSchedule.set(false);
    this.store.setTimelinePaused(false);
  }

  onSaveScheduleEdit(): void {
    if (this.savingSchedule() || !this.editScheduleRuleId) return;

    if (this.editScheduleEndHour <= this.editScheduleStartHour) {
      this.feedback.showToast(this.translate.instant('automation.toast.invalidSchedule'), 'warning');
      return;
    }

    this.savingSchedule.set(true);
    this.store
      .updateRuleSchedule(
        this.editScheduleRuleId,
        this.editScheduleStartHour,
        this.editScheduleEndHour,
        this.editScheduleGroup,
      )
      .subscribe({
        next: () => {
          this.closeScheduleEditModal();
          this.feedback.showToast(this.translate.instant('automation.toast.scheduleSaved'), 'success');
        },
        error: () => {
          this.savingSchedule.set(false);
          this.feedback.showToast(this.translate.instant('automation.toast.scheduleSaveFailed'), 'error');
        },
      });
  }

  onOpenZoneConfiguration(): void {
    const slotId =
      this.editScheduleRuleId ||
      this.store.selectedTimelineSlot()?.ruleId ||
      this.store.selectedTimelineSlotId();
    this.store.rememberTimelineSelection(slotId);
    this.closeScheduleEditModal();
    this.router.navigate(['/app/automation/zones']);
    this.feedback.showToast(this.translate.instant('automation.toast.openingSchedule'), 'info');
  }



  slotStatusKey(slot: TimelineSlotResponse): string {

    if (slot.isRunningNow) return 'automation.timeline.status.running';

    if (slot.endsInMinutes !== undefined && slot.endsInMinutes <= 60) {

      return 'automation.timeline.status.scheduled';

    }

    return 'automation.timeline.status.waiting';

  }



  onToggleRule(rule: AutomationRule): void {

    this.store.toggleRule(rule.id);

    this.feedback.showToast(

      this.translate.instant(

        rule.active ? 'automation.toast.ruleDisabled' : 'automation.toast.ruleEnabled',

        { name: rule.name },

      ),

      'success',

    );

  }



  onViewAuditLog(): void {

    this.router.navigate(['/app/reports/alerts-history']);

    this.feedback.showToast(this.translate.instant('automation.toast.showingAuditLog'), 'info');

  }



  onCreateBusinessRule(): void {

    this.newRuleName = '';

    this.newRuleDescription = '';

    this.newRuleGroup = 'Whole Building';

    this.newRuleStartHour = 8;

    this.newRuleEndHour = 18;

    this.showNewRuleModal.set(true);

  }



  closeNewRuleModal(): void {

    this.showNewRuleModal.set(false);

  }



  onEditShutdownProtocol(): void {
    const protocol = this.store.shutdownProtocol();
    if (!protocol) return;

    this.shutdownStepDraft.set(protocol.steps.map(step => ({ ...step })));
    this.store.setTimelinePaused(true);
    this.showShutdownModal.set(true);
  }

  closeShutdownModal(): void {
    this.showShutdownModal.set(false);
    this.savingShutdown.set(false);
    this.store.setTimelinePaused(false);
  }

  onSaveShutdownProtocol(): void {
    if (this.savingShutdown()) return;

    this.savingShutdown.set(true);
    this.store.saveShutdownProtocol(this.shutdownStepDraft()).subscribe({
      next: () => {
        this.closeShutdownModal();
        this.feedback.showToast(this.translate.instant('automation.toast.shutdownSaved'), 'success');
      },
      error: () => {
        this.savingShutdown.set(false);
        this.feedback.showToast(this.translate.instant('automation.toast.shutdownSaveFailed'), 'error');
      },
    });
  }



  onPostponeShutdown(): void {

    this.store.postponeShutdown(15);

    this.feedback.showToast(this.translate.instant('automation.toast.shutdownPostponed'), 'info');

  }



  onToggleShutdownStepDraft(stepId: string): void {
    this.shutdownStepDraft.update(steps =>
      steps.map(step =>
        step.id === stepId ? { ...step, disabled: !step.disabled } : step,
      ),
    );
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showScheduleEditModal()) {
      this.closeScheduleEditModal();
      return;
    }
    if (this.showShutdownModal()) {
      this.closeShutdownModal();
      return;
    }
    if (this.showNewRuleModal()) {
      this.closeNewRuleModal();
    }
  }



  onNewScenario(): void {

    this.onCreateBusinessRule();

  }



  onQuickAssist(): void {

    this.router.navigate(['/app/automation/builder']);

    this.feedback.showToast(this.translate.instant('automation.toast.openingBuilder'), 'info');

  }



  onConfirmCreateBusinessRule(): void {

    const name = this.newRuleName.trim();

    if (!name) {

      this.feedback.showToast(this.translate.instant('automation.toast.ruleNameRequired'), 'warning');

      return;

    }

    if (this.newRuleEndHour <= this.newRuleStartHour) {
      this.feedback.showToast(this.translate.instant('automation.toast.invalidSchedule'), 'warning');
      return;
    }



    const rule = this.store.addBusinessRule(
      name,
      this.newRuleDescription,
      this.newRuleGroup,
      this.newRuleStartHour,
      this.newRuleEndHour,
    );

    this.closeNewRuleModal();

    this.feedback.showToast(

      this.translate.instant('automation.toast.created', { name: rule.name }),

      'success',

    );

  }



  onScheduleRowClick(assetGroup: string): void {
    this.store.rememberTimelineSelection();
    this.router.navigate(['/app/automation/zones']);
    this.feedback.showToast(
      this.translate.instant('automation.toast.openingSchedule', { group: assetGroup }),
      'info',
    );
  }



  ruleStatusKey(rule: AutomationRule): string {

    return rule.isActive() ? 'automation.active' : 'automation.inactive';

  }



  overtimeClass(type: string): string {
    return `overtime-pill overtime-pill--${type}`;
  }

  overtimeLabelKey(type: string): string {
    return `automation.overtimeTypes.${type}`;
  }

  shutdownStepLabel(step: { label: string; labelKey?: string }): string {
    return step.labelKey ? this.translate.instant(step.labelKey) : step.label;
  }
}


