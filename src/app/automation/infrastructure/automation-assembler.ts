import { AutomationRule } from '../domain/model/automation-rule.entity';
import { ShutdownProtocol } from '../domain/model/shutdown-protocol.entity';
import {
  AutomationRuleResponse,
  ShutdownProtocolResponse,
} from './automation-response';

export class AutomationAssembler {
  static toAutomationRule(dto: AutomationRuleResponse): AutomationRule {
    return new AutomationRule(
      dto.id,
      dto.name,
      dto.description,
      dto.icon,
      dto.active,
      dto.group,
      dto.status,
      {
        startHour: dto.timeline.startHour,
        endHour: dto.timeline.endHour,
        label: dto.timeline.label,
        color: dto.timeline.color,
      }
    );
  }

  static toAutomationRuleList(dtos: AutomationRuleResponse[]): AutomationRule[] {
    return dtos.map(dto => this.toAutomationRule(dto));
  }

  static toShutdownProtocol(dto: ShutdownProtocolResponse): ShutdownProtocol {
    return new ShutdownProtocol(
      dto.id,
      dto.name,
      dto.description,
      dto.triggersInMinutes,
      dto.steps.map(s => ({
        id: s.id,
        label: s.label,
        icon: s.icon,
        disabled: s.disabled,
      }))
    );
  }
}
