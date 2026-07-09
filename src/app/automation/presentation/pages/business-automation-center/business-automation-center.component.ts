import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AutomationStore } from '../../../application/automation.store';

import { AutomationRule } from '../../../domain/model/automation-rule.entity';

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

  readonly hoveredSlotId = signal<string | null>(null);



  newRuleName = '';

  newRuleDescription = '';

  newRuleGroup = 'Whole Building';



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
    const slots = this.visibleTimelineSlots().filter(slot => slot.category === 'operational');
    const stacks = getMaxStackIndex(slots, 'operational');
    return OPERATIONAL_TOP + (stacks + 1) * (SLOT_HEIGHT + SLOT_GAP);
  });

  readonly timelineTrackHeight = computed(() => {
    const slots = this.visibleTimelineSlots();
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
    return this.visibleTimelineSlots().some(slot => slot.category === 'security');
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

      return;

    }



    this.showShutdownModal.set(true);

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

      this.router.navigate(['/app/automation/zones']);

      this.feedback.showToast(

        this.translate.instant('automation.toast.openingSchedule', { group: slot.group ?? slot.label }),

        'info',

      );

      return;

    }



    this.showShutdownModal.set(true);

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

    this.showNewRuleModal.set(true);

  }



  closeNewRuleModal(): void {

    this.showNewRuleModal.set(false);

  }



  onEditShutdownProtocol(): void {

    this.showShutdownModal.set(true);

  }



  closeShutdownModal(): void {

    this.showShutdownModal.set(false);

  }



  onSaveShutdownProtocol(): void {

    this.closeShutdownModal();

    this.feedback.showToast(this.translate.instant('automation.toast.shutdownSaved'), 'success');

  }



  onPostponeShutdown(): void {

    this.store.postponeShutdown(15);

    this.feedback.showToast(this.translate.instant('automation.toast.shutdownPostponed'), 'info');

  }



  onToggleShutdownStep(stepId: string): void {

    this.store.toggleShutdownStep(stepId);

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



    const rule = this.store.addBusinessRule(name, this.newRuleDescription, this.newRuleGroup);

    this.closeNewRuleModal();

    this.feedback.showToast(

      this.translate.instant('automation.toast.created', { name: rule.name }),

      'success',

    );

  }



  onScheduleRowClick(assetGroup: string): void {

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
}


