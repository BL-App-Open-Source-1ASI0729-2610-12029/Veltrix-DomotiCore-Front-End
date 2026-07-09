export type RuleStatus = 'ACTIVE' | 'INACTIVE';

export interface TimelineSlot {
  startHour: number;
  endHour: number;
  label: string;
  color: string;
}

export class AutomationRule {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly active: boolean,
    public readonly group: string,
    public readonly status: RuleStatus,
    public readonly timeline: TimelineSlot
  ) {}

  isActive(): boolean {
    return this.active && this.status === 'ACTIVE';
  }

  toggle(): AutomationRule {
    const nextActive = !this.active;
    return new AutomationRule(
      this.id,
      this.name,
      this.description,
      this.icon,
      nextActive,
      this.group,
      nextActive ? 'ACTIVE' : 'INACTIVE',
      this.timeline
    );
  }
}
