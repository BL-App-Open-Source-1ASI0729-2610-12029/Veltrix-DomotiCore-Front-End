import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClientService } from '../../shared/services/api-client.service';
import {
  AutomationRecipe,
  BuilderActionOption,
  BuilderCondition,
  BuilderTriggerOption,
  SuggestedTemplate,
  mapActionOption,
  mapAutomationRecipe,
  mapBuilderCondition,
  mapSuggestedTemplate,
  mapTriggerOption,
} from '../domain/model/automation-builder.entity';
import {
  AutomationRecipeResponse,
  BuilderActionOptionResponse,
  BuilderConditionResponse,
  BuilderTriggerOptionResponse,
  SuggestedTemplateResponse,
} from './automation-builder-response';

const RECIPE_FILE = 'automation-recipe';
const TRIGGERS_FILE = 'automation-builder-triggers';
const CONDITIONS_FILE = 'automation-builder-conditions';
const ACTIONS_FILE = 'automation-builder-actions';
const TEMPLATES_FILE = 'automation-suggested-templates';
const RECIPE_ID = 1;

@Injectable({ providedIn: 'root' })
export class AutomationBuilderApiService {
  private readonly api = inject(ApiClientService);

  getRecipe(): Observable<AutomationRecipe> {
    return this.api
      .getSingleton<AutomationRecipeResponse>(RECIPE_FILE, RECIPE_ID, RECIPE_FILE)
      .pipe(map(mapAutomationRecipe));
  }

  updateRecipe(recipe: AutomationRecipe): Observable<AutomationRecipe> {
    return this.api
      .patchSingleton<AutomationRecipeResponse>(
        RECIPE_FILE,
        recipe.id,
        recipe,
        RECIPE_FILE,
      )
      .pipe(map(mapAutomationRecipe));
  }

  getTriggers(): Observable<BuilderTriggerOption[]> {
    return this.api
      .getCollection<BuilderTriggerOptionResponse>(TRIGGERS_FILE, TRIGGERS_FILE)
      .pipe(map(items => items.map(mapTriggerOption)));
  }

  getConditions(): Observable<BuilderCondition[]> {
    return this.api
      .getCollection<BuilderConditionResponse>(CONDITIONS_FILE, CONDITIONS_FILE)
      .pipe(map(items => items.map(mapBuilderCondition)));
  }

  getActions(): Observable<BuilderActionOption[]> {
    return this.api
      .getCollection<BuilderActionOptionResponse>(ACTIONS_FILE, ACTIONS_FILE)
      .pipe(map(items => items.map(mapActionOption)));
  }

  getSuggestedTemplates(): Observable<SuggestedTemplate[]> {
    return this.api
      .getCollection<SuggestedTemplateResponse>(TEMPLATES_FILE, TEMPLATES_FILE)
      .pipe(map(items => items.map(mapSuggestedTemplate)));
  }

  createCondition(condition: BuilderCondition): Observable<BuilderCondition> {
    return this.api
      .postToCollection<BuilderConditionResponse>(
        CONDITIONS_FILE,
        condition,
        CONDITIONS_FILE,
      )
      .pipe(map(mapBuilderCondition));
  }

  updateCondition(condition: BuilderCondition): Observable<BuilderCondition> {
    return this.api
      .patchInCollection<BuilderConditionResponse>(
        CONDITIONS_FILE,
        condition.id,
        condition,
        CONDITIONS_FILE,
      )
      .pipe(map(mapBuilderCondition));
  }

  deleteCondition(id: string): Observable<void> {
    return this.api.deleteFromCollection(CONDITIONS_FILE, id, CONDITIONS_FILE);
  }
}
