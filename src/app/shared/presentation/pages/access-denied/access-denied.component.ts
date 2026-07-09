import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../iam/application/auth.service';
import { GOOGLE_ICONS } from '../../../constants/google-icons';
import { MATERIAL_IMPORTS } from '../../../material';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.css',
})
export class AccessDeniedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly icons = GOOGLE_ICONS;
  reason: 'segment' | 'permission' | 'unknown' = 'unknown';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const value = params['reason'];
      if (value === 'segment' || value === 'permission') {
        this.reason = value;
        return;
      }
      this.reason = 'unknown';
    });
  }

  messageKey(): string {
    if (this.reason === 'segment') {
      return 'accessDenied.segmentMessage';
    }
    if (this.reason === 'permission') {
      return 'accessDenied.permissionMessage';
    }
    return 'accessDenied.genericMessage';
  }

  goHome(): void {
    void this.router.navigateByUrl(this.auth.getDefaultRoute());
  }
}
