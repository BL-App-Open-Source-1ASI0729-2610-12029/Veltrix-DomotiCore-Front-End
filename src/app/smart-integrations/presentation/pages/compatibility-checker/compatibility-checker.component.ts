import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { IntegrationsApiService } from '../../../infrastructure/integrations-api.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

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
  private readonly integrationsApi = inject(IntegrationsApiService);

  checkCompatibility(): void {
    const query = this.deviceQuery().trim();
    if (!query) {
      this.feedback.showToast(this.translate.instant('compatibility.toast.queryRequired'), 'warning');
      return;
    }

    this.integrationsApi.checkCompatibility(query).subscribe(result => {
      if (result.messageKey) {
        this.resultKey.set(result.compatible ? 'compatibility.result.compatible' : 'compatibility.result.incompatible');
        return;
      }
      this.resultKey.set(result.compatible ? 'compatibility.result.compatible' : 'compatibility.result.incompatible');
    });
  }
}
