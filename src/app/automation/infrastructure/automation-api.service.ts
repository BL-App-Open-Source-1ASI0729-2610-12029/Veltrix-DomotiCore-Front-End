import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClientService } from '../../shared/services/api-client.service';
import { AutomationAssembler } from './automation-assembler';
import { AutomationRule } from '../domain/model/automation-rule.entity';
import { ShutdownProtocol } from '../domain/model/shutdown-protocol.entity';
import {
  ActiveRuleTimelineResponse,
  ActiveSceneResponse,
  AutomationRuleResponse,
  EfficiencyInsightResponse,
  GroupScheduleResponse,
  ShutdownProtocolResponse,
  SmartSuggestionResponse,
  UpcomingEventResponse,
  AutomationHomePreferencesResponse,
} from './automation-response';

const MOCK_RULES: AutomationRuleResponse[] = [
  {
    id: '1',
    name: 'Dim if Office Empty',
    description: 'If motion is not detected for 10 minutes, dim "Sales Area" lights to 20%.',
    icon: 'visibility_off',
    active: false,
    group: 'Sales Team',
    status: 'INACTIVE',
    timeline: { startHour: 8, endHour: 18, label: 'Daylight Optimization: Office Lighting Group', color: '#3b5bdb' },
  },
  {
    id: '2',
    name: 'Adaptive Climate Control',
    description: 'Adjust thermostat based on external humidity and solar gain sensors.',
    icon: 'ac_unit',
    active: true,
    group: 'Whole Building',
    status: 'ACTIVE',
    timeline: { startHour: 8, endHour: 20, label: 'Main Hall Temperature Regulation (22°C)', color: '#7048e8' },
  },
];

const MOCK_PROTOCOL: ShutdownProtocolResponse = {
  id: 'closing-time',
  name: 'Closing Time',
  description: 'Master protocol for facility shutdown. Triggers in 15 minutes.',
  triggersInMinutes: 15,
  steps: [
    { id: 's1', label: 'Lock all external access points', labelKey: 'automation.shutdownSteps.lockAccess', icon: 'lock', disabled: false },
    { id: 's2', label: 'Set HVAC to 18°C (Eco-Mode)', labelKey: 'automation.shutdownSteps.hvacEco', icon: 'thermostat', disabled: false },
    { id: 's3', label: 'Shut down server racks', labelKey: 'automation.shutdownSteps.shutdownRacks', icon: 'power_settings_new', disabled: true },
  ],
};

const MOCK_SCHEDULES: GroupScheduleResponse[] = [
  { assetGroup: 'Executive Suite', morningOn: '07:30 AM', eveningOff: '08:00 PM', overtimeRule: 'Manual Override', overtimeType: 'manual' },
  { assetGroup: 'Customer Lounge', morningOn: '08:00 AM', eveningOff: '06:00 PM', overtimeRule: 'Motion Sensor', overtimeType: 'motion' },
];

const MOCK_INSIGHTS: EfficiencyInsightResponse = { savingsPercent: 12.4, totalSavedKwh: 1240, co2AvoidedTons: 0.85 };
const MOCK_SCENES: ActiveSceneResponse[] = [
  {
    id: 'away-mode',
    name: 'Away Mode',
    nameKey: 'automation.mock.scenes.awayMode.name',
    description: 'When everyone leaves home',
    descriptionKey: 'automation.mock.scenes.awayMode.description',
    icon: 'home',
    iconBg: '#eef3ff',
    active: false,
  },
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    nameKey: 'automation.mock.scenes.morningRoutine.name',
    description: 'Weekdays at 6:30 AM',
    descriptionKey: 'automation.mock.scenes.morningRoutine.description',
    icon: 'light_mode',
    iconBg: '#fff7ed',
    active: true,
  },
  {
    id: 'movie-night',
    name: 'Movie Night',
    nameKey: 'automation.mock.scenes.movieNight.name',
    description: 'Dim lights, close blinds',
    descriptionKey: 'automation.mock.scenes.movieNight.description',
    icon: 'tv',
    iconBg: '#f5f3ff',
    active: false,
  },
  {
    id: 'night-mode',
    name: 'Night Mode',
    nameKey: 'automation.mock.scenes.nightMode.name',
    description: 'Activates at 11:00 PM',
    descriptionKey: 'automation.mock.scenes.nightMode.description',
    icon: 'dark_mode',
    iconBg: '#eef3ff',
    active: true,
  },
];

const MOCK_UPCOMING: UpcomingEventResponse[] = [
  {
    id: 'evt-lights',
    time: '10:00 PM',
    title: 'TURN OFF ALL LIGHTS',
    titleKey: 'automation.mock.events.turnOffLights.title',
    activeDays: [true, true, true, true, true, false, false],
    footerIcon: 'lightbulb',
    footerText: '24 connected devices',
    footerTextKey: 'automation.mock.events.turnOffLights.footer',
    active: true,
  },
  {
    id: 'evt-morning',
    time: '07:00 AM',
    title: 'MORNING WAKE UP',
    titleKey: 'automation.mock.events.morningWakeup.title',
    activeDays: [true, true, true, true, true, false, false],
    footerIcon: 'thermostat',
    footerText: 'Target: 22°C',
    footerTextKey: 'automation.mock.events.morningWakeup.footer',
    active: true,
  },
  {
    id: 'evt-security',
    time: '06:00 PM',
    title: 'EVENING SECURITY CHECK',
    titleKey: 'automation.mock.events.eveningSecurity.title',
    activeDays: [true, true, true, true, true, true, true],
    footerIcon: 'shield',
    footerText: 'Perimeter sensors',
    footerTextKey: 'automation.mock.events.eveningSecurity.footer',
    active: false,
  },
];
const MOCK_SUGGESTION: SmartSuggestionResponse = {
  message: 'Based on your usage patterns, we suggest creating an automation to turn off the living room TV when no motion is detected for 30 minutes.',
  messageKey: 'automation.mock.suggestion.message',
  visible: true,
};
const MOCK_TIMELINE: ActiveRuleTimelineResponse = {
  currentTime: '17:45',
  currentDecimal: 17.75,
  activeCount: 5,
  runningNowCount: 3,
  conflictCount: 1,
  slots: [],
};

@Injectable({ providedIn: 'root' })
export class AutomationApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  getBusinessRules(): Observable<AutomationRule[]> {
    return this.getArray<AutomationRuleResponse>('automation/rules', MOCK_RULES).pipe(
      map(AutomationAssembler.toAutomationRuleList),
    );
  }

  toggleRule(id: string): Observable<AutomationRule> {
    if (this.api.hasApi()) {
      return this.http
        .post<AutomationRuleResponse>(`${this.baseUrl()}/automation/rules/${id}/toggle`, {})
        .pipe(
          map(dto => AutomationAssembler.toAutomationRule(dto)),
          catchError(() => {
            const rule = MOCK_RULES.find(r => r.id === id);
            if (rule) rule.active = !rule.active;
            return of(AutomationAssembler.toAutomationRule(rule!));
          }),
        );
    }

    const rule = MOCK_RULES.find(r => r.id === id);
    if (rule) rule.active = !rule.active;
    return of(AutomationAssembler.toAutomationRule(rule!));
  }

  getShutdownProtocol(): Observable<ShutdownProtocol> {
    return this.getObject<ShutdownProtocolResponse>('automation/shutdown-protocol', MOCK_PROTOCOL).pipe(
      map(AutomationAssembler.toShutdownProtocol),
    );
  }

  getGroupSchedules(): Observable<GroupScheduleResponse[]> {
    return this.getArray<GroupScheduleResponse>('automation/group-schedules', MOCK_SCHEDULES);
  }

  getEfficiencyInsights(): Observable<EfficiencyInsightResponse> {
    return this.getObject<EfficiencyInsightResponse>('automation/efficiency-insights', MOCK_INSIGHTS);
  }

  getActiveRuleTimeline(): Observable<ActiveRuleTimelineResponse> {
    return this.getObject<ActiveRuleTimelineResponse>('automation/active-rule-timeline', MOCK_TIMELINE);
  }

  getActiveScenes(): Observable<ActiveSceneResponse[]> {
    return this.getArray<ActiveSceneResponse>('automation/active-scenes', MOCK_SCENES);
  }

  toggleScene(id: string): Observable<ActiveSceneResponse> {
    return this.toggleItem<ActiveSceneResponse>('automation/active-scenes', id, MOCK_SCENES);
  }

  getUpcomingEvents(): Observable<UpcomingEventResponse[]> {
    return this.getArray<UpcomingEventResponse>('automation/upcoming-events', MOCK_UPCOMING);
  }

  toggleUpcomingEvent(id: string): Observable<UpcomingEventResponse> {
    return this.toggleItem<UpcomingEventResponse>('automation/upcoming-events', id, MOCK_UPCOMING);
  }

  getSmartSuggestion(): Observable<SmartSuggestionResponse> {
    return this.getObject<SmartSuggestionResponse>('automation/smart-suggestion', MOCK_SUGGESTION);
  }

  getHomePreferences(): Observable<AutomationHomePreferencesResponse> {
    return this.getObject<AutomationHomePreferencesResponse>('automation/home-preferences', {
      inactivityAutoOffEnabled: false,
      inactivityMinutes: 30,
      autoOptimizationEnabled: false,
    });
  }

  patchHomePreferences(
    patch: Partial<AutomationHomePreferencesResponse>,
  ): Observable<AutomationHomePreferencesResponse> {
    if (!this.api.hasApi()) {
      return of({
        inactivityAutoOffEnabled: patch.inactivityAutoOffEnabled ?? false,
        inactivityMinutes: patch.inactivityMinutes ?? 30,
        autoOptimizationEnabled: patch.autoOptimizationEnabled ?? false,
      });
    }

    return this.http
      .patch<AutomationHomePreferencesResponse>(`${this.baseUrl()}/automation/home-preferences`, patch)
      .pipe(
        catchError(() =>
          of({
            inactivityAutoOffEnabled: patch.inactivityAutoOffEnabled ?? false,
            inactivityMinutes: patch.inactivityMinutes ?? 30,
            autoOptimizationEnabled: patch.autoOptimizationEnabled ?? false,
          }),
        ),
      );
  }

  private getArray<T>(path: string, fallback: T[]): Observable<T[]> {
    if (!this.api.hasApi()) {
      return of(fallback);
    }
    return this.http.get<T[]>(`${this.baseUrl()}/${path}`).pipe(catchError(() => of(fallback)));
  }

  private getObject<T>(path: string, fallback: T): Observable<T> {
    if (!this.api.hasApi()) {
      return of(fallback);
    }
    return this.http.get<T>(`${this.baseUrl()}/${path}`).pipe(catchError(() => of(fallback)));
  }

  private toggleItem<T extends { id?: string; active?: boolean }>(
    path: string,
    id: string,
    fallback: T[],
  ): Observable<T> {
    if (this.api.hasApi()) {
      return this.http.post<T>(`${this.baseUrl()}/${path}/${id}/toggle`, {}).pipe(
        catchError(() => {
          const item = fallback.find(entry => entry.id === id);
          if (item) item.active = !item.active;
          return of(item!);
        }),
      );
    }

    const item = fallback.find(entry => entry.id === id);
    if (item) item.active = !item.active;
    return of(item!);
  }

  private baseUrl(): string {
    return environment.apiUrl.replace(/\/$/, '');
  }

  activateEcoMode(): Observable<{ ecoModeActive?: boolean; devicesTurnedOff?: string[] }> {
    if (!this.api.hasApi()) {
      return of({ ecoModeActive: true, devicesTurnedOff: [] });
    }

    return this.http
      .post<{ ecoModeActive?: boolean; devicesTurnedOff?: string[] }>(
        `${this.baseUrl()}/automation/activate-eco-mode`,
        {},
      )
      .pipe(catchError(() => of({ ecoModeActive: true, devicesTurnedOff: [] })));
  }

  executeScene(sceneId: string): Observable<{ executed?: boolean; sceneId?: string }> {
    if (!this.api.hasApi()) {
      return of({ executed: false, sceneId });
    }

    return this.http
      .post<{ executed?: boolean; sceneId?: string }>(
        `${this.baseUrl()}/automation/scenes/${sceneId}/execute`,
        {},
      )
      .pipe(catchError(() => of({ executed: false, sceneId })));
  }

  createRule(payload: {
    id?: string;
    name: string;
    description?: string;
    group?: string;
    icon?: string;
    active?: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
    timeline?: { startHour?: number; endHour?: number; label?: string; color?: string };
  }): Observable<AutomationRuleResponse> {
    const fallback: AutomationRuleResponse = {
      id: payload.id ?? `rule-${Date.now()}`,
      name: payload.name,
      description: payload.description ?? '',
      icon: payload.icon ?? 'auto_awesome',
      active: payload.active ?? true,
      group: payload.group ?? 'Custom Group',
      status: payload.status ?? 'ACTIVE',
      timeline: {
        startHour: payload.timeline?.startHour ?? 8,
        endHour: payload.timeline?.endHour ?? 18,
        label: payload.timeline?.label ?? payload.name,
        color: payload.timeline?.color ?? '#4263eb',
      },
    };

    if (!this.api.hasApi()) {
      MOCK_RULES.push(fallback);
      return of(fallback);
    }

    return this.http
      .post<AutomationRuleResponse>(`${this.baseUrl()}/automation/rules`, payload)
      .pipe(catchError(() => {
        MOCK_RULES.push(fallback);
        return of(fallback);
      }));
  }

  toggleShutdownStep(stepId: string): Observable<ShutdownProtocolResponse> {
    const toggleMockStep = (): ShutdownProtocolResponse => {
      const step = MOCK_PROTOCOL.steps.find(entry => entry.id === stepId);
      if (step) step.disabled = !step.disabled;
      return {
        ...MOCK_PROTOCOL,
        steps: MOCK_PROTOCOL.steps.map(entry => ({ ...entry })),
      };
    };

    if (!this.api.hasApi()) {
      return of(toggleMockStep());
    }

    return this.http
      .post<ShutdownProtocolResponse>(`${this.baseUrl()}/automation/shutdown-protocol/steps/${stepId}/toggle`, {})
      .pipe(catchError(() => of(toggleMockStep())));
  }

  saveShutdownProtocol(protocol: ShutdownProtocolResponse): Observable<ShutdownProtocolResponse> {
    MOCK_PROTOCOL.id = protocol.id;
    MOCK_PROTOCOL.name = protocol.name;
    MOCK_PROTOCOL.description = protocol.description;
    MOCK_PROTOCOL.triggersInMinutes = protocol.triggersInMinutes;
    MOCK_PROTOCOL.steps = protocol.steps.map(step => ({ ...step }));

    const snapshot: ShutdownProtocolResponse = {
      ...MOCK_PROTOCOL,
      steps: MOCK_PROTOCOL.steps.map(step => ({ ...step })),
    };

    if (!this.api.hasApi()) {
      return of(snapshot);
    }

    return this.http
      .put<ShutdownProtocolResponse>(`${this.baseUrl()}/automation/shutdown-protocol`, protocol);
  }

  dismissSmartSuggestion(): Observable<SmartSuggestionResponse> {
    if (!this.api.hasApi()) {
      return of({ ...MOCK_SUGGESTION, visible: false });
    }

    return this.http
      .post<SmartSuggestionResponse>(`${this.baseUrl()}/automation/smart-suggestion/dismiss`, {})
      .pipe(catchError(() => of({ ...MOCK_SUGGESTION, visible: false })));
  }
}
