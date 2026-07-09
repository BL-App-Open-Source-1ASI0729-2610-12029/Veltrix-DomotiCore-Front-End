import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutomationStore } from '../../../application/automation.store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { PageToolbarActionsComponent } from '../../../../shared/presentation/components/page-toolbar-actions/page-toolbar-actions.component';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { AutomationNavComponent } from '../../components/automation-nav/automation-nav.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-automation-center',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageToolbarActionsComponent, AutomationNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './automation-center.component.html',
  styleUrl: './automation-center.component.css',
})
export class AutomationCenterComponent implements OnInit {
  readonly store = inject(AutomationStore);
  readonly icons = GOOGLE_ICONS;
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly dayLabelKeys = [
    'automation.days.mon',
    'automation.days.tue',
    'automation.days.wed',
    'automation.days.thu',
    'automation.days.fri',
    'automation.days.sat',
    'automation.days.sun',
  ];

  showNewAutomationModal = signal(false);
  showBuilderModal = signal(false);
  showAllEvents = signal(false);

  newAutomationName = '';
  newAutomationTrigger = 'time';
  builderName = '';
  builderCondition = 'temperature > 25°C';
  builderAction = 'Turn on AC';

  ngOnInit(): void {
    this.store.loadAll();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setSearchQuery(value);
  }

  onToggleInactivity(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.store.toggleInactivityAutoOff(enabled);
    const key = enabled ? 'automation.inactivity.toastEnabled' : 'automation.inactivity.toastDisabled';
    this.feedback.showToast(this.translate.instant(key), 'success');
  }

  onInactivityMinutes(value: number): void {
    this.store.setInactivityMinutes(Number(value) || 30);
  }

  getSceneIcon(icon: string): string {
    const map: Record<string, string> = {
      dark_mode:  GOOGLE_ICONS.darkMode,
      home:       GOOGLE_ICONS.home,
      light_mode: GOOGLE_ICONS.lightMode,
      tv:         GOOGLE_ICONS.tv,
      lightbulb:  GOOGLE_ICONS.lightbulb,
      thermostat: GOOGLE_ICONS.thermostat,
      shield:     GOOGLE_ICONS.shield,
    };
    return map[icon] ?? GOOGLE_ICONS.settings;
  }

  getActiveDaysSummary(activeDays: boolean[]): string {
    if (!activeDays.some(Boolean)) {
      return this.translate.instant('automation.schedule.paused');
    }

    if (activeDays.every(Boolean)) {
      return this.translate.instant('automation.schedule.everyDay');
    }

    if (activeDays.slice(0, 5).every(Boolean) && !activeDays[5] && !activeDays[6]) {
      return this.translate.instant('automation.schedule.weekdays');
    }

    if (!activeDays.slice(0, 5).some(Boolean) && activeDays[5] && activeDays[6]) {
      return this.translate.instant('automation.schedule.weekends');
    }

    const labels = this.dayLabelKeys
      .map((key, index) => (activeDays[index] ? this.translate.instant(key) : null))
      .filter((label): label is string => Boolean(label));

    return labels.join(' · ');
  }

  onNewAutomation(): void {
    this.newAutomationName = '';
    this.newAutomationTrigger = 'time';
    this.showNewAutomationModal.set(true);
  }

  closeNewAutomationModal(): void {
    this.showNewAutomationModal.set(false);
  }

  submitNewAutomation(): void {
    if (!this.newAutomationName.trim()) return;

    this.store.upcomingEvents.update(events => [
      ...events,
      {
        id: `custom-${Date.now()}`,
        time: '08:00 AM',
        title: this.newAutomationName.trim(),
        active: true,
        activeDays: [true, true, true, true, true, false, false],
        footerIcon: 'lightbulb',
        footerText: `Trigger: ${this.newAutomationTrigger}`,
      },
    ]);

    this.closeNewAutomationModal();
    this.feedback.showToast(this.translate.instant('automation.toast.created', { name: this.newAutomationName }), 'success');
  }

  onViewMoreEvents(): void {
    this.showAllEvents.set(true);
    this.feedback.showToast(this.translate.instant('automation.toast.showingAllEvents'), 'info');
  }

  onOpenBuilder(): void {
    this.router.navigate(['/app/automation/builder']);
  }

  closeBuilderModal(): void {
    this.showBuilderModal.set(false);
  }

  submitBuilder(): void {
    if (!this.builderName.trim()) return;

    this.store.activeScenes.update(scenes => [
      ...scenes,
      {
        id: `scene-${Date.now()}`,
        name: this.builderName.trim(),
        description: `${this.builderCondition} → ${this.builderAction}`,
        icon: 'auto_awesome',
        iconBg: '#eef2ff',
        active: true,
      },
    ]);

    this.closeBuilderModal();
    this.feedback.showToast(this.translate.instant('automation.toast.logicSaved', { name: this.builderName }), 'success');
  }

  onCreateFromSuggestion(): void {
    const suggestion = this.store.smartSuggestion();
    if (!suggestion) return;

    this.store.upcomingEvents.update(events => [
      ...events,
      {
        id: `suggestion-${Date.now()}`,
        time: '07:30 PM',
        title: this.translate.instant('automation.suggestionAutomationTitle'),
        active: true,
        activeDays: [true, true, true, true, true, true, true],
        footerIcon: 'lightbulb',
        footerText: suggestion.message,
      },
    ]);

    this.store.dismissSuggestion();
    this.feedback.showToast(this.translate.instant('automation.toast.createdFromSuggestion'), 'success');
  }
}
