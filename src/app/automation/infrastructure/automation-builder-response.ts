export type RecipeStatus = 'draft' | 'published';
export type RecipeCategory = 'efficiency' | 'security' | 'comfort';

export interface AutomationRecipeResponse {
  id: number;
  nameKey: string;
  status: RecipeStatus;
  category: RecipeCategory;
  selectedTriggerId: string;
  triggerTime: string;
  selectedActionId: string;
}

export interface BuilderTriggerOptionResponse {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

export interface BuilderConditionResponse {
  id: string;
  icon: string;
  titleKey: string;
  ruleKey: string;
  ruleValue?: string;
}

export interface TemplatePresetResponse {
  nameKey: string;
  category: RecipeCategory;
  selectedTriggerId: string;
  triggerTime?: string;
  selectedActionId: string;
}

export interface BuilderActionOptionResponse {
  id: string;
  icon: string;
  titleKey: string;
  tone: 'primary' | 'blue' | 'orange' | 'neutral';
}

export interface SuggestedTemplateResponse {
  id: string;
  type: 'featured' | 'compact';
  tagKey?: string;
  titleKey: string;
  descriptionKey: string;
  ctaKey?: string;
  imageUrl?: string;
  icon?: string;
  tone?: string;
  preset?: TemplatePresetResponse;
}
