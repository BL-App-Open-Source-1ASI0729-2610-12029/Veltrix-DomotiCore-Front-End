import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GatewayStore } from '../../../application/gateway.store';
import { AuthService } from '../../../../iam/application/auth.service';
import { RolePermissionService } from '../../../../iam/application/role-permission.service';
import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';

@Component({
  selector: 'app-gateway-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ...MATERIAL_IMPORTS],
  templateUrl: './gateway-setup.component.html',
  styleUrls: ['./gateway-setup.component.css'],
})
export class GatewaySetupComponent implements OnInit {
  readonly store = inject(GatewayStore);
  readonly auth = inject(AuthService);
  readonly permissions = inject(RolePermissionService);
  readonly canManage = computed(() => this.permissions.canManageGateways());
  readonly isBusiness = computed(() => this.auth.getEffectiveAccountType() === 'small-business');

  readonly gatewayCode = signal('');
  readonly gatewayLabel = signal('Veltrix Home Gateway');
  readonly nodeName = signal('');
  readonly nodeType = signal('smart-bulb');

  private readonly feedback = inject(UiFeedbackService);
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    this.store.load().subscribe(() => this.store.loadNodes().subscribe());
  }

  onLinkGateway(): void {
    if (!this.canManage()) return;

    const code = this.gatewayCode().trim();
    if (!code) {
      this.feedback.showToast(this.translate.instant('gateway.toast.codeRequired'), 'warning');
      return;
    }

    this.store.link(code, this.gatewayLabel()).subscribe({
      next: () => {
        this.feedback.showToast(this.translate.instant('gateway.toast.linkedOnline'), 'success');
        this.gatewayCode.set('');
      },
      error: () => {
        this.feedback.showToast(this.translate.instant('gateway.toast.notDetected'), 'error');
      },
    });
  }

  onUnlinkGateway(): void {
    if (!this.canManage()) return;
    if (!this.feedback.confirmAction(this.translate.instant('common.confirm.unlinkGateway'))) return;

    this.store.unlink().subscribe({
      next: () => this.feedback.showToast(this.translate.instant('gateway.toast.unlinked'), 'info'),
    });
  }

  onRegisterNode(): void {
    if (!this.canManage()) return;

    const name = this.nodeName().trim();
    if (!name) {
      this.feedback.showToast(this.translate.instant('gateway.toast.nodeNameRequired'), 'warning');
      return;
    }

    this.store.registerNode(name, this.nodeType()).subscribe({
      next: node => {
        if (node.status === 'registered') {
          this.feedback.showToast(this.translate.instant('gateway.toast.nodeRegistered'), 'success');
          this.nodeName.set('');
          return;
        }
        this.feedback.showToast(this.translate.instant('gateway.toast.nodeFailed'), 'error');
      },
      error: err => {
        const key =
          err?.message === 'GATEWAY_OFFLINE'
            ? 'gateway.toast.gatewayOffline'
            : 'gateway.toast.nodeFailed';
        this.feedback.showToast(this.translate.instant(key), 'error');
      },
    });
  }

  statusLabelKey(): string {
    const gateway = this.store.gateway();
    if (!gateway) return 'gateway.status.unlinked';
    return gateway.status === 'online' ? 'gateway.status.online' : 'gateway.status.offline';
  }
}
