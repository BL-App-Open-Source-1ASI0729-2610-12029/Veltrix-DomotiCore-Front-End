export interface AutomationRuleResponse {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  group: string;
  status: 'ACTIVE' | 'INACTIVE';
  timeline: {
    startHour: number;
    endHour: number;
    label: string;
    color: string;
  };
}

export interface ShutdownStepResponse {
  id: string;
  label: string;
  icon: string;
  disabled: boolean;
}

export interface ShutdownProtocolResponse {
  id: string;
  name: string;
  description: string;
  triggersInMinutes: number;
  steps: ShutdownStepResponse[];
}

export interface GroupScheduleResponse {
  assetGroup: string;
  morningOn: string;
  eveningOff: string;
  overtimeRule: string;
  overtimeType: 'manual' | 'motion' | 'photo';
}

export interface EfficiencyInsightResponse {
  savingsPercent: number;
  totalSavedKwh: number;
  co2AvoidedTons: number;
}

export interface TimelineSlotResponse {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  color: string;
  isAlert?: boolean;
  lane?: number;
  ruleId?: string;
  style?: 'solid' | 'dashed';
  category?: 'operational' | 'security';
  stackIndex?: number;
  group?: string;
  description?: string;
  isRunningNow?: boolean;
  hasConflict?: boolean;
  conflictCount?: number;
  progressPercent?: number;
  endsInMinutes?: number;
}

export interface ActiveRuleTimelineResponse {
  currentTime: string;
  currentDecimal: number;
  activeCount: number;
  runningNowCount: number;
  conflictCount: number;
  slots: TimelineSlotResponse[];
}

export interface ActiveSceneResponse {
  id: string;
  name: string;
  description: string;
  nameKey?: string;
  descriptionKey?: string;
  icon: string;
  iconBg: string;
  active: boolean;
}

export interface UpcomingEventResponse {
  id: string;
  time: string;
  title: string;
  titleKey?: string;
  activeDays: boolean[];
  footerIcon: string;
  footerText: string;
  footerTextKey?: string;
  active: boolean;
}

export interface SmartSuggestionResponse {
  message: string;
  messageKey?: string;
  visible: boolean;
}

export interface AutomationHomePreferencesResponse {
  inactivityAutoOffEnabled: boolean;
  inactivityMinutes: number;
  autoOptimizationEnabled: boolean;
}
