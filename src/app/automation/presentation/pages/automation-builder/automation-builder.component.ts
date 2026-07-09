import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AutomationBuilderStore } from '../../../application/automation-builder.store';
import { AutomationStore } from '../../../application/automation.store';
import { BuilderCondition, SuggestedTemplate } from '../../../domain/model/automation-builder.entity';
import { GOOGLE_ICONS, GoogleIconKey } from '../../../../shared/constants/google-icons';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { AutomationNavComponent } from '../../components/automation-nav/automation-nav.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-automation-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, AutomationNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './automation-builder.component.html',
  styleUrl: './automation-builder.component.css',
})
export class AutomationBuilderComponent implements OnInit {
  readonly store = inject(AutomationBuilderStore);
  private readonly automationStore = inject(AutomationStore);
  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly icons = GOOGLE_ICONS;

  showMoreActionsModal = signal(false);
  showAddConditionModal = signal(false);
  editingCondition = signal<BuilderCondition | null>(null);
  editConditionValue = '';

  ngOnInit(): void {
    this.store.loadAll();
  }

  onSearch(event: Event): void {
    this.store.setSearchQuery((event.target as HTMLInputElement).value);
  }

  getIcon(iconKey: string): string {
    return GOOGLE_ICONS[iconKey as GoogleIconKey] ?? GOOGLE_ICONS.settings;
  }

  onSelectTrigger(triggerId: string): void {
    const trigger = this.store.selectTrigger(triggerId);
    if (!trigger) return;

    this.feedback.showToast(
      this.translate.instant('automationBuilder.toast.triggerSelected', {
        name: this.translate.instant(trigger.titleKey),
      }),
      'info',
    );
  }

  onSelectAction(actionId: string): void {
    const result = this.store.selectAction(actionId);
    if (result === 'more') {
      this.showMoreActionsModal.set(true);
      return;
    }
    if (!result) return;

    this.feedback.showToast(
      this.translate.instant(`automationBuilder.toast.actions.${actionId}`, {
        name: this.translate.instant(result.titleKey),
      }),
      actionId === 'lock-doors' ? 'success' : 'info',
    );
  }

  onSelectExtraAction(actionId: string): void {
    const action = this.store.selectExtraAction(actionId);
    if (!action) return;

    this.showMoreActionsModal.set(false);
    this.feedback.showToast(
      this.translate.instant(`automationBuilder.toast.extraActions.${actionId}`, {
        name: this.translate.instant(action.titleKey),
      }),
      'success',
    );
  }

  saveRecipe(): void {
    const recipe = this.store.saveRecipe();
    if (!recipe) {
      this.feedback.showToast(this.translate.instant('automationBuilder.toast.recipeIncomplete'), 'warning');
      return;
    }

    const recipeName = this.translate.instant(recipe.nameKey);
    const triggerLabel = this.store.getTriggerLabel(recipe.selectedTriggerId);
    const actionLabel = this.store.getActionLabel(recipe.selectedActionId);
    const timeSuffix =
      recipe.selectedTriggerId === 'time-of-day'
        ? ` @ ${recipe.triggerTime}`
        : '';

    this.automationStore.activeScenes.update(scenes => [
      ...scenes,
      {
        id: `recipe-${Date.now()}`,
        name: recipeName,
        description: `${triggerLabel}${timeSuffix} → ${actionLabel}`,
        icon: recipe.category === 'security' ? 'shield' : recipe.category === 'efficiency' ? 'eco' : 'home',
        iconBg: recipe.category === 'security' ? '#eef2ff' : recipe.category === 'efficiency' ? '#fff4e8' : '#f3f4f6',
        active: true,
      },
    ]);

    this.feedback.showToast(
      this.translate.instant('automationBuilder.toast.recipeSaved', { name: recipeName }),
      'success',
    );

    this.router.navigate(['/app/automation/center']);
  }

  onTriggerTimeChange(event: Event): void {
    const time = (event.target as HTMLInputElement).value;
    this.store.setTriggerTime(time);
    this.feedback.showToast(
      this.translate.instant('automationBuilder.toast.timeUpdated', { time }),
      'info',
    );
  }

  openAddConditionModal(): void {
    this.showAddConditionModal.set(true);
  }

  closeAddConditionModal(): void {
    this.showAddConditionModal.set(false);
  }

  addCondition(type: 'humidity' | 'motion' | 'door'): void {
    const condition = this.store.addCondition(type);
    this.closeAddConditionModal();

    if (!condition) return;

    this.feedback.showToast(
      this.translate.instant('automationBuilder.toast.conditionAdded', {
        name: this.translate.instant(condition.titleKey),
      }),
      'success',
    );
  }

  openEditCondition(condition: BuilderCondition): void {
    this.editingCondition.set(condition);
    this.editConditionValue = condition.ruleValue ?? '22';
  }

  closeEditCondition(): void {
    this.editingCondition.set(null);
    this.editConditionValue = '';
  }

  saveConditionEdit(): void {
    const condition = this.editingCondition();
    if (!condition || !this.editConditionValue.trim()) return;

    this.store.updateConditionThreshold(condition.id, this.editConditionValue.trim());
    this.closeEditCondition();
    this.feedback.showToast(this.translate.instant('automationBuilder.toast.conditionUpdated'), 'success');
  }

  removeCondition(conditionId: string): void {
    this.store.removeCondition(conditionId);
    this.feedback.showToast(this.translate.instant('automationBuilder.toast.conditionRemoved'), 'info');
  }

  applyTemplate(template: SuggestedTemplate): void {
    const recipe = this.store.applyTemplate(template);
    if (!recipe) {
      this.feedback.showToast(this.translate.instant('automationBuilder.toast.templateUnavailable'), 'warning');
      return;
    }

    this.feedback.showToast(
      this.translate.instant('automationBuilder.toast.templateApplied', {
        name: this.translate.instant(template.titleKey),
      }),
      'success',
    );
  }

  viewAllTemplates(): void {
    this.store.toggleShowAllTemplates();
    this.feedback.showToast(
      this.translate.instant(
        this.store.showAllTemplates()
          ? 'automationBuilder.toast.showingAllTemplates'
          : 'automationBuilder.toast.showingFeaturedTemplates',
      ),
      'info',
    );
  }

  featuredTemplate(): SuggestedTemplate | undefined {
    return this.store.visibleTemplates().find(template => template.type === 'featured');
  }

  compactTemplates(): SuggestedTemplate[] {
    return this.store.visibleTemplates().filter(template => template.type === 'compact');
  }

  conditionRule(condition: BuilderCondition): string {
    if (condition.ruleValue) {
      return this.translate.instant(condition.ruleKey, { value: condition.ruleValue });
    }
    return this.translate.instant(condition.ruleKey);
  }

  closeMoreActionsModal(): void {
    this.showMoreActionsModal.set(false);
  }
}
