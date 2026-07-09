import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../iam/application/auth.service';
import { AutomationCenterComponent } from '../automation-center/automation-center.component';
import { BusinessAutomationCenterComponent } from '../business-automation-center/business-automation-center.component';

@Component({
  selector: 'app-automation-center-host',
  standalone: true,
  imports: [AutomationCenterComponent, BusinessAutomationCenterComponent],
  template: `
    @if (auth.getAccountType() === 'small-business') {
      <app-business-automation-center />
    } @else {
      <app-automation-center />
    }
  `,
})
export class AutomationCenterHostComponent {
  readonly auth = inject(AuthService);
}
