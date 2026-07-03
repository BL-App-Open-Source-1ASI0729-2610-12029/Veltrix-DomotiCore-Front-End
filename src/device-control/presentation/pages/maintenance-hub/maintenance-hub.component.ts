import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaintenanceStore } from '../../../application/maintenance.store';
import { BusinessDevicesNavComponent } from '../../components/business-devices-nav/business-devices-nav.component';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-maintenance-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, BusinessDevicesNavComponent, ...MATERIAL_IMPORTS],
  templateUrl: './maintenance-hub.component.html',
  styleUrls: ['./maintenance-hub.component.css'],
})
export class MaintenanceHubComponent implements OnInit {
  readonly store = inject(MaintenanceStore);

  readonly deviceName = signal('');
  readonly description = signal('');
  readonly performedAt = signal(new Date().toISOString().slice(0, 10));
  readonly technician = signal('');

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    this.store.load();
  }

  onSubmit(): void {
    const name = this.deviceName().trim();
    const desc = this.description().trim();
    if (!name || !desc || !this.performedAt()) {
      this.feedback.showToast(this.translate.instant('maintenance.toast.required'), 'warning');
      return;
    }

    this.store.register({
      deviceId: name.toLowerCase().replace(/\s+/g, '-'),
      deviceName: name,
      performedAt: new Date(this.performedAt()).toISOString(),
      description: desc,
      technician: this.technician().trim() || undefined,
    });

    this.deviceName.set('');
    this.description.set('');
    this.technician.set('');
    this.feedback.showToast(this.translate.instant('maintenance.toast.saved'), 'success');
  }
}
