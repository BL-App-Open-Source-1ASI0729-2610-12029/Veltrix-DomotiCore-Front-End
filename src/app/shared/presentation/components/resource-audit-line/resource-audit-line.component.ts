import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ResourceAuditFields,
  hasResourceAudit,
} from '../../../models/resource-audit.model';

@Component({
  selector: 'app-resource-audit-line',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <p class="resource-audit-line" *ngIf="showAudit()">
      <span *ngIf="createdLabel() as created">{{ created }}</span>
      <span *ngIf="updatedLabel() as updated" class="resource-audit-line__updated">{{ updated }}</span>
    </p>
  `,
  styles: [`
    .resource-audit-line {
      margin: 0.25rem 0 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      font-size: 0.82rem;
      color: var(--gray-500, #6b7a94);
      line-height: 1.4;
    }

    .resource-audit-line__updated {
      opacity: 0.9;
    }
  `],
})
export class ResourceAuditLineComponent {
  private readonly translate = inject(TranslateService);

  readonly audit = input.required<ResourceAuditFields>();

  readonly showAudit = computed(() => hasResourceAudit(this.audit()));

  readonly createdLabel = computed(() => this.formatCreated(this.audit()));
  readonly updatedLabel = computed(() => this.formatUpdated(this.audit()));

  private formatCreated(audit: ResourceAuditFields): string | null {
    if (!audit.createdByName || !audit.createdAt) {
      return null;
    }

    return this.translate.instant('resourceAudit.createdBy', {
      name: audit.createdByName,
      role: this.roleLabel(audit.createdByRole),
      when: this.formatWhen(audit.createdAt),
    });
  }

  private formatUpdated(audit: ResourceAuditFields): string | null {
    if (!audit.updatedByName || !audit.updatedAt) {
      return null;
    }

    return this.translate.instant('resourceAudit.updatedBy', {
      name: audit.updatedByName,
      role: this.roleLabel(audit.updatedByRole),
      when: this.formatWhen(audit.updatedAt),
    });
  }

  private roleLabel(role?: string): string {
    const key = this.roleKey(role);
    return key ? this.translate.instant(key) : this.translate.instant('roles.platform.user');
  }

  private roleKey(role?: string): string | null {
    switch ((role ?? '').toLowerCase()) {
      case 'admin':
        return 'roles.platform.admin';
      case 'moderator':
        return 'roles.platform.moderator';
      case 'user':
        return 'roles.platform.user';
      case 'system':
        return 'resourceAudit.systemRole';
      default:
        return role ? null : 'roles.platform.user';
    }
  }

  private formatWhen(iso: string): string {
    return new Date(iso).toLocaleString();
  }
}
