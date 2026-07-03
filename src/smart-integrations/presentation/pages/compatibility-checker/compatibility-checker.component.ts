import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

const COMPATIBLE_DEVICES = [
  'philips hue',
  'tp-link kasa',
  'sonoff',
  'shelly',
  'nest thermostat',
  'ring sensor',
  'aqara',
  'tuya smart bulb',
  'smart plug',
  'motion sensor',
];

@Component({
  selector: 'app-compatibility-checker',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './compatibility-checker.component.html',
  styleUrls: ['./compatibility-checker.component.css'],
})
export class CompatibilityCheckerComponent {
  readonly deviceQuery = signal('');
  readonly resultKey = signal<string | null>(null);

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  checkCompatibility(): void {
    const query = this.deviceQuery().trim().toLowerCase();
    if (!query) {
      this.feedback.showToast(this.translate.instant('compatibility.toast.queryRequired'), 'warning');
      return;
    }

    const compatible = COMPATIBLE_DEVICES.some(item => query.includes(item) || item.includes(query));
    this.resultKey.set(compatible ? 'compatibility.result.compatible' : 'compatibility.result.incompatible');
  }
}
