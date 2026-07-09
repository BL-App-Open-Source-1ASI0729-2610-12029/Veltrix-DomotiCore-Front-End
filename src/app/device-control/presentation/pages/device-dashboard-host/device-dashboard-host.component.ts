import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../iam/application/auth.service';
import { BusinessDeviceManagementComponent } from '../business-device-management/business-device-management.component';
import { DeviceDashboardComponent } from '../device-dashboard/device-dashboard.component';

@Component({
  selector: 'app-device-dashboard-host',
  standalone: true,
  imports: [DeviceDashboardComponent, BusinessDeviceManagementComponent],
  templateUrl: './device-dashboard-host.component.html',
})
export class DeviceDashboardHostComponent {
  readonly auth = inject(AuthService);
}
