import { CommonModule } from '@angular/common';

import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TeamManagementStore } from '../../../application/team-management.store';

import {

  TeamMemberResponse,

  TeamMemberRole,

  TeamMemberTab,

  ZonePermissionResponse,

} from '../../../infrastructure/team-management-response';

import { BusinessUsersNavComponent } from '../../components/business-users-nav/business-users-nav.component';

import { GOOGLE_ICONS } from '../../../../shared/constants/google-icons';
import { APP_CURRENT_YEAR } from '../../../../shared/constants/app.constants';

import { UiFeedbackService } from '../../../../shared/services/ui-feedback.service';
import { RolePermissionService } from '../../../../iam/application/role-permission.service';
import { MATERIAL_IMPORTS } from '../../../../shared/material';



const MEMBER_MENU_WIDTH = 196;

const MEMBER_MENU_HEIGHT = 168;



@Component({

  selector: 'app-team-management',

  standalone: true,

  imports: [CommonModule, FormsModule, TranslateModule, BusinessUsersNavComponent, ...MATERIAL_IMPORTS],

  templateUrl: './team-management.component.html',

  styleUrls: ['./team-management.component.css', '../../styles/team-animations.css'],

})

export class TeamManagementComponent implements OnInit {

  readonly store = inject(TeamManagementStore);
  readonly permissions = inject(RolePermissionService);

  readonly icons = GOOGLE_ICONS;

  readonly currentYear = APP_CURRENT_YEAR;



  private readonly feedback = inject(UiFeedbackService);

  private readonly translate = inject(TranslateService);

  private readonly router = inject(Router);



  readonly tabs: TeamMemberTab[] = ['all', 'pending', 'archived'];

  readonly roles: TeamMemberRole[] = ['administrator', 'manager', 'viewer'];



  readonly memberMenuAnchor = signal<DOMRect | null>(null);



  addMemberName = '';

  addMemberEmail = '';

  addMemberRole: TeamMemberRole = 'viewer';

  addMemberZones: string[] = ['global'];



  editMemberName = '';

  editMemberEmail = '';

  editMemberRole: TeamMemberRole = 'viewer';

  editMemberZones: string[] = [];



  zonePermissionDraft = signal<ZonePermissionResponse[]>([]);



  readonly activeMemberMenu = computed(() => {

    const memberId = this.store.openMemberMenuId();

    const payload = this.store.data();

    if (!memberId || !payload) return null;

    return payload.members.find(member => member.id === memberId) ?? null;

  });



  readonly memberMenuStyle = computed(() => {

    const rect = this.memberMenuAnchor();

    if (!rect) return null;



    const viewportPadding = 12;

    let top = rect.bottom + 6;

    let left = rect.right - MEMBER_MENU_WIDTH;



    if (top + MEMBER_MENU_HEIGHT > window.innerHeight - viewportPadding) {

      top = rect.top - MEMBER_MENU_HEIGHT - 6;

    }



    if (left < viewportPadding) {

      left = viewportPadding;

    }



    if (left + MEMBER_MENU_WIDTH > window.innerWidth - viewportPadding) {

      left = window.innerWidth - MEMBER_MENU_WIDTH - viewportPadding;

    }



    return {

      top: `${Math.max(viewportPadding, top)}px`,

      left: `${left}px`,

    };

  });



  readonly selectableZones = computed(() => {

    const payload = this.store.data();

    if (!payload) return ['global'];

    return payload.zonePermissions.map(permission => permission.zone);

  });



  readonly pageNumbers = computed(() => {

    const total = this.store.totalPages();

    return Array.from({ length: total }, (_, index) => index + 1);

  });



  ngOnInit(): void {

    this.store.load();

  }



  @HostListener('document:click', ['$event'])

  onDocumentClick(event: MouseEvent): void {

    const target = event.target as HTMLElement | null;

    if (!target?.closest('.zone-filter')) {

      this.store.closeZoneFilterMenu();

    }

    if (!target?.closest('.member-actions-trigger') && !target?.closest('.member-actions-flyout')) {

      this.closeMemberMenu();

    }

  }



  @HostListener('window:scroll')

  @HostListener('window:resize')

  onViewportChange(): void {

    this.closeMemberMenu();

  }



  tabKey(tab: TeamMemberTab): string {

    return `teamManagement.tabs.${tab}`;

  }



  tabCount(tab: TeamMemberTab): number {

    return this.store.tabCounts()[tab];

  }



  roleClass(role: TeamMemberRole): string {

    return `role-pill role-pill--${role}`;

  }



  roleKey(role: TeamMemberRole): string {

    return `teamManagement.roles.${role}`;

  }



  statusClass(member: TeamMemberResponse): string {

    if (member.tab === 'pending') return 'member-status member-status--pending';

    if (member.tab === 'archived') return 'member-status member-status--archived';

    return `member-status member-status--${member.status}`;

  }



  statusKey(member: TeamMemberResponse): string {

    if (member.tab === 'pending') return 'teamManagement.status.pending';

    if (member.tab === 'archived') return 'teamManagement.status.archived';

    return `teamManagement.status.${member.status}`;

  }



  zoneKey(zone: string): string {
    return `teamManagement.zones.${zone}`;
  }

  zoneFilterLabel(): string {

    const zone = this.store.zoneFilter();

    return zone === 'all'

      ? this.translate.instant('teamManagement.filterAllZones')

      : this.translate.instant(this.zoneKey(zone));

  }



  paginationText(): string {

    const label = this.store.paginationLabel();

    if (!label || label === '0') {

      return this.translate.instant('teamManagement.pagination.empty');

    }



    const [range, total] = label.split(':');

    const [from, to] = range.split('-');

    return this.translate.instant('teamManagement.pagination.showing', {

      from,

      to,

      total,

    });

  }



  isZoneSelected(zones: string[], zone: string): boolean {

    return zones.includes(zone);

  }



  toggleZoneSelection(zones: string[], zone: string, mode: 'add' | 'edit'): void {

    const next = zones.includes(zone)

      ? zones.filter(item => item !== zone)

      : [...zones, zone];



    if (mode === 'add') {

      this.addMemberZones = next.length ? next : ['global'];

      return;

    }



    this.editMemberZones = next.length ? next : ['global'];

  }



  onAddMember(): void {

    this.resetAddForm();

    this.store.openAddMemberModal();

  }



  onSubmitAddMember(): void {

    if (!this.addMemberName.trim() || !this.addMemberEmail.trim()) return;



    this.store.addMember({

      name: this.addMemberName,

      email: this.addMemberEmail,

      role: this.addMemberRole,

      zones: this.addMemberZones,

    });



    this.feedback.showToast(

      this.translate.instant('teamManagement.toast.memberInvited', { name: this.addMemberName.trim() }),

      'success',

    );

    this.resetAddForm();

  }



  onToggleMemberMenu(member: TeamMemberResponse, event: Event): void {

    event.stopPropagation();

    const button = event.currentTarget as HTMLElement;

    const opened = this.store.toggleMemberMenu(member.id);



    if (opened) {

      this.memberMenuAnchor.set(button.getBoundingClientRect());

      return;

    }



    this.memberMenuAnchor.set(null);

  }



  closeMemberMenu(): void {

    this.store.closeMemberMenu();

    this.memberMenuAnchor.set(null);

  }



  onEditMember(member: TeamMemberResponse): void {

    this.editMemberName = member.name;

    this.editMemberEmail = member.email;

    this.editMemberRole = member.role;

    this.editMemberZones = [...member.zones];

    this.store.openEditMemberModal(member.id);

  }



  onSubmitEditMember(): void {

    const member = this.store.editingMember();

    if (!member || !this.editMemberName.trim() || !this.editMemberEmail.trim()) return;



    this.store.updateMember(member.id, {

      name: this.editMemberName,

      email: this.editMemberEmail,

      role: this.editMemberRole,

      zones: this.editMemberZones,

    });



    this.feedback.showToast(

      this.translate.instant('teamManagement.toast.memberUpdated', { name: this.editMemberName.trim() }),

      'success',

    );

  }



  onResendInvite(member: TeamMemberResponse): void {

    const updated = this.store.resendInvite(member.id);

    if (!updated) return;

    this.feedback.showToast(

      this.translate.instant('teamManagement.toast.inviteResent', { name: updated.name }),

      'success',

    );

  }



  onArchiveMember(member: TeamMemberResponse): void {

    this.store.archiveMember(member.id);

    this.feedback.showToast(

      this.translate.instant('teamManagement.toast.memberArchived', { name: member.name }),

      'warning',

    );

  }



  onRestoreMember(member: TeamMemberResponse): void {

    this.store.restoreMember(member.id);

    this.feedback.showToast(

      this.translate.instant('teamManagement.toast.memberRestored', { name: member.name }),

      'success',

    );

  }



  onRemoveMember(member: TeamMemberResponse): void {

    this.store.removeMember(member.id);

    this.feedback.showToast(

      this.translate.instant('teamManagement.toast.memberRemoved', { name: member.name }),

      'warning',

    );

  }



  onSetupZoneAccess(): void {

    const permissions = this.store.data()?.zonePermissions ?? [];

    this.zonePermissionDraft.set(structuredClone(permissions));

    this.store.openZoneAccessModal();

  }



  onToggleZonePermission(zone: string): void {

    this.zonePermissionDraft.update(items =>

      items.map(item => (item.zone === zone ? { ...item, enabled: !item.enabled } : item)),

    );

  }



  onChangeZoneDefaultRole(zone: string, role: TeamMemberRole): void {

    this.zonePermissionDraft.update(items =>

      items.map(item => (item.zone === zone ? { ...item, defaultRole: role } : item)),

    );

  }



  onSaveZonePermissions(): void {

    this.store.saveZonePermissions(this.zonePermissionDraft());

    this.feedback.showToast(this.translate.instant('teamManagement.toast.zonePermissionsSaved'), 'success');

  }



  onReadDocumentation(): void {

    this.feedback.openHelp('integrations');

  }



  onViewAuditHistory(): void {

    this.router.navigate(['/app/reports/alerts-history']);

  }



  onFooterLink(link: 'terms' | 'privacy' | 'status'): void {

    this.store.openFooterModal(link);

  }



  footerModalTitleKey(): string {

    const modal = this.store.footerModal();

    if (!modal) return '';

    return `teamManagement.footerModals.${modal}.title`;

  }



  footerModalBodyKey(): string {

    const modal = this.store.footerModal();

    if (!modal) return '';

    return `teamManagement.footerModals.${modal}.body`;

  }



  private resetAddForm(): void {

    this.addMemberName = '';

    this.addMemberEmail = '';

    this.addMemberRole = 'viewer';

    this.addMemberZones = ['global'];

  }

}


