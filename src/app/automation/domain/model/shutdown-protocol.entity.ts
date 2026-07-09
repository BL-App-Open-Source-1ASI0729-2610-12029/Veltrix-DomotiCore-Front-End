export interface ShutdownStep {
  id: string;
  label: string;
  icon: string;
  disabled: boolean;
}

export class ShutdownProtocol {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly triggersInMinutes: number,
    public readonly steps: ShutdownStep[]
  ) {}

  getActiveSteps(): ShutdownStep[] {
    return this.steps.filter(s => !s.disabled);
  }

  getDisabledSteps(): ShutdownStep[] {
    return this.steps.filter(s => s.disabled);
  }
}
