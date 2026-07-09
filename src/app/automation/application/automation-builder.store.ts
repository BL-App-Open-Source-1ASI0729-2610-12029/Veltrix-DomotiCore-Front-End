import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  AutomationRecipe,
  BuilderActionOption,
  BuilderCondition,
  BuilderTriggerOption,
  ExtraActionOption,
  SuggestedTemplate,
} from '../domain/model/automation-builder.entity';
import { AutomationBuilderApiService } from '../infrastructure/automation-builder-api.service';

@Injectable({ providedIn: 'root' })
export class AutomationBuilderStore {
  private readonly api = inject(AutomationBuilderApiService);
  private readonly translate = inject(TranslateService);

  readonly recipe = signal<AutomationRecipe | null>(null);
  readonly triggers = signal<BuilderTriggerOption[]>([]);
  readonly conditions = signal<BuilderCondition[]>([]);
  readonly actions = signal<BuilderActionOption[]>([]);
  readonly templates = signal<SuggestedTemplate[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly showAllTemplates = signal(false);

  readonly extraActions: ExtraActionOption[] = [
    { id: 'notify', icon: 'notifications', titleKey: 'automationBuilder.extraActions.notify' },
    { id: 'arm-security', icon: 'shield', titleKey: 'automationBuilder.extraActions.armSecurity' },
    { id: 'run-scene', icon: 'autoAwesome', titleKey: 'automationBuilder.extraActions.runScene' },
  ];

  readonly filteredTemplates = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.templates();
    if (!query) return items;

    return items.filter(template => {
      const title = this.translate.instant(template.titleKey).toLowerCase();
      const description = this.translate.instant(template.descriptionKey).toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  });

  readonly visibleTemplates = computed(() =>
    this.showAllTemplates() ? this.filteredTemplates() : this.filteredTemplates(),
  );

  loadAll(): void {
    this.loading.set(true);

    this.api.getRecipe().subscribe({ next: recipe => this.recipe.set(recipe) });
    this.api.getTriggers().subscribe({ next: triggers => this.triggers.set(triggers) });
    this.api.getConditions().subscribe({ next: conditions => this.conditions.set(conditions) });
    this.api.getActions().subscribe({ next: actions => this.actions.set(actions) });

    this.api.getSuggestedTemplates().subscribe({
      next: templates => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  toggleShowAllTemplates(): void {
    this.showAllTemplates.update(value => !value);
  }

  selectTrigger(triggerId: string): BuilderTriggerOption | null {
    const trigger = this.triggers().find(item => item.id === triggerId);
    const current = this.recipe();
    if (!trigger || !current) return null;

    const updated = { ...current, selectedTriggerId: triggerId };
    this.recipe.set(updated);
    this.api.updateRecipe(updated).subscribe();
    return trigger;
  }

  setTriggerTime(time: string): void {
    const current = this.recipe();
    if (!current) return;

    const updated = { ...current, triggerTime: time };
    this.recipe.set(updated);
    this.api.updateRecipe(updated).subscribe();
  }

  selectAction(actionId: string): BuilderActionOption | 'more' | null {
    if (actionId === 'more') return 'more';

    const action = this.actions().find(item => item.id === actionId);
    const current = this.recipe();
    if (!action || !current) return null;

    const updated = { ...current, selectedActionId: actionId };
    this.recipe.set(updated);
    this.api.updateRecipe(updated).subscribe();
    return action;
  }

  selectExtraAction(actionId: string): ExtraActionOption | null {
    const action = this.extraActions.find(item => item.id === actionId);
    if (!action) return null;

    const current = this.recipe();
    if (!current) return null;

    const updated = {
      ...current,
      selectedActionId: `extra-${actionId}`,
    };
    this.recipe.set(updated);
    this.api.updateRecipe(updated).subscribe();
    return action;
  }

  addCondition(type: 'humidity' | 'motion' | 'door'): BuilderCondition | null {
    const presets: Record<typeof type, Omit<BuilderCondition, 'id'>> = {
      humidity: {
        icon: 'airPurifier',
        titleKey: 'automationBuilder.conditions.humidity.title',
        ruleKey: 'automationBuilder.conditions.humidity.rule',
        ruleValue: '65',
      },
      motion: {
        icon: 'signal',
        titleKey: 'automationBuilder.conditions.motion.title',
        ruleKey: 'automationBuilder.conditions.motion.rule',
        ruleValue: '10',
      },
      door: {
        icon: 'door',
        titleKey: 'automationBuilder.conditions.doorOpen.title',
        ruleKey: 'automationBuilder.conditions.doorOpen.rule',
      },
    };

    const preset = presets[type];
    const newCondition: BuilderCondition = {
      id: `condition-${Date.now()}`,
      ...preset,
    };

    this.conditions.update(items => [...items, newCondition]);
    this.api.createCondition(newCondition).subscribe({
      next: saved => {
        this.conditions.update(items =>
          items.map(item => (item.id === newCondition.id ? saved : item)),
        );
      },
    });

    return newCondition;
  }

  updateConditionThreshold(conditionId: string, value: string): BuilderCondition | null {
    const condition = this.conditions().find(item => item.id === conditionId);
    if (!condition) return null;

    const updated = { ...condition, ruleValue: value };
    this.conditions.update(items => items.map(item => (item.id === conditionId ? updated : item)));
    this.api.updateCondition(updated).subscribe();
    return updated;
  }

  removeCondition(conditionId: string): void {
    this.conditions.update(items => items.filter(item => item.id !== conditionId));
    this.api.deleteCondition(conditionId).subscribe();
  }

  applyTemplate(template: SuggestedTemplate): AutomationRecipe | null {
    const current = this.recipe();
    if (!current || !template.preset) return null;

    const updated: AutomationRecipe = {
      ...current,
      nameKey: template.preset.nameKey,
      category: template.preset.category,
      selectedTriggerId: template.preset.selectedTriggerId,
      triggerTime: template.preset.triggerTime ?? current.triggerTime,
      selectedActionId: template.preset.selectedActionId,
      status: 'draft',
    };

    this.recipe.set(updated);
    this.api.updateRecipe(updated).subscribe();
    return updated;
  }

  saveRecipe(): AutomationRecipe | null {
    const current = this.recipe();
    if (!current) return null;

    if (!current.selectedTriggerId || !current.selectedActionId) return null;

    const updated = { ...current, status: 'published' as const };
    this.recipe.set(updated);
    this.api.updateRecipe(updated).subscribe();
    return updated;
  }

  getTriggerLabel(triggerId: string): string {
    const trigger = this.triggers().find(item => item.id === triggerId);
    return trigger ? this.translate.instant(trigger.titleKey) : triggerId;
  }

  getActionLabel(actionId: string): string {
    if (actionId.startsWith('extra-')) {
      const extraId = actionId.replace('extra-', '');
      const extra = this.extraActions.find(item => item.id === extraId);
      return extra ? this.translate.instant(extra.titleKey) : actionId;
    }

    const action = this.actions().find(item => item.id === actionId);
    return action ? this.translate.instant(action.titleKey) : actionId;
  }
}
