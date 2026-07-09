import {
  AutomationRecipeResponse,
  BuilderActionOptionResponse,
  BuilderConditionResponse,
  BuilderTriggerOptionResponse,
  SuggestedTemplateResponse,
} from '../../infrastructure/automation-builder-response';

export interface AutomationRecipe {
  id: number;
  nameKey: string;
  status: AutomationRecipeResponse['status'];
  category: AutomationRecipeResponse['category'];
  selectedTriggerId: string;
  triggerTime: string;
  selectedActionId: string;
}

export interface BuilderTriggerOption {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

export interface BuilderCondition {
  id: string;
  icon: string;
  titleKey: string;
  ruleKey: string;
  ruleValue?: string;
}

export interface TemplatePreset {
  nameKey: string;
  category: AutomationRecipe['category'];
  selectedTriggerId: string;
  triggerTime?: string;
  selectedActionId: string;
}

export interface BuilderActionOption {
  id: string;
  icon: string;
  titleKey: string;
  tone: BuilderActionOptionResponse['tone'];
}

export interface SuggestedTemplate {
  id: string;
  type: SuggestedTemplateResponse['type'];
  tagKey?: string;
  titleKey: string;
  descriptionKey: string;
  ctaKey?: string;
  imageUrl?: string;
  icon?: string;
  tone?: string;
  preset?: TemplatePreset;
}

export interface ExtraActionOption {
  id: string;
  icon: string;
  titleKey: string;
}

export function mapAutomationRecipe(dto: AutomationRecipeResponse): AutomationRecipe {
  return { ...dto };
}

export function mapTriggerOption(dto: BuilderTriggerOptionResponse): BuilderTriggerOption {
  return { ...dto };
}

export function mapBuilderCondition(dto: BuilderConditionResponse): BuilderCondition {
  return { ...dto };
}

export function mapActionOption(dto: BuilderActionOptionResponse): BuilderActionOption {
  return { ...dto };
}

export function mapSuggestedTemplate(dto: SuggestedTemplateResponse): SuggestedTemplate {
  return { ...dto };
}
