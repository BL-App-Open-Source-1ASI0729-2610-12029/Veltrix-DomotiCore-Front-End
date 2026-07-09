import { Injectable, computed, inject, signal } from '@angular/core';
import { TeamManagementApiService } from '../infrastructure/team-management-api.service';
import {
  TeamManagementResponse,
  TeamMemberResponse,
  TeamMemberRole,
  TeamMemberTab,
  ZonePermissionResponse,
} from '../infrastructure/team-management-response';

export type TeamFooterModal = 'terms' | 'privacy' | 'status' | null;

export interface TeamMemberFormPayload {
  name: string;
  email: string;
  role: TeamMemberRole;
  zones: string[];
}

@Injectable({ providedIn: 'root' })
export class TeamManagementStore {
  private readonly api = inject(TeamManagementApiService);

  readonly data = signal<TeamManagementResponse | null>(null);
  readonly loading = signal(false);
  readonly activeTab = signal<TeamMemberTab>('all');
  readonly zoneFilter = signal('all');
  readonly currentPage = signal(1);
  readonly showZoneFilterMenu = signal(false);
  readonly openMemberMenuId = signal<string | null>(null);
  readonly showAddMemberModal = signal(false);
  readonly showZoneAccessModal = signal(false);
  readonly editingMemberId = signal<string | null>(null);
  readonly footerModal = signal<TeamFooterModal>(null);

  readonly zoneOptions = computed(() => {
    const members = this.data()?.members ?? [];
    const zones = new Set<string>();
    members.forEach(member => member.zones.forEach(zone => zones.add(zone)));
    this.data()?.zonePermissions.forEach(permission => zones.add(permission.zone));
    return ['all', ...Array.from(zones).sort()];
  });

  readonly tabCounts = computed(() => {
    const members = this.data()?.members ?? [];
    return {
      all: members.filter(member => member.tab === 'all').length,
      pending: members.filter(member => member.tab === 'pending').length,
      archived: members.filter(member => member.tab === 'archived').length,
    };
  });

  readonly filteredMembers = computed(() => {
    const payload = this.data();
    if (!payload) return [];

    const tab = this.activeTab();
    const zone = this.zoneFilter();

    return payload.members.filter(member => {
      const matchesTab = member.tab === tab;
      const matchesZone = zone === 'all' || member.zones.includes(zone);
      return matchesTab && matchesZone;
    });
  });

  readonly pagedMembers = computed(() => {
    const payload = this.data();
    if (!payload) return [];

    const pageSize = payload.pageSize;
    const start = (this.currentPage() - 1) * pageSize;
    return this.filteredMembers().slice(start, start + pageSize);
  });

  readonly paginationLabel = computed(() => {
    const payload = this.data();
    if (!payload) return '';

    const total = this.filteredMembers().length;
    if (!total) return '0';

    const start = (this.currentPage() - 1) * payload.pageSize + 1;
    const end = Math.min(this.currentPage() * payload.pageSize, total);
    return `${start}-${end}:${total}`;
  });

  readonly totalPages = computed(() => {
    const payload = this.data();
    if (!payload) return 1;
    return Math.max(1, Math.ceil(this.filteredMembers().length / payload.pageSize));
  });

  readonly editingMember = computed(() => {
    const id = this.editingMemberId();
    const payload = this.data();
    if (!id || !payload) return null;
    return payload.members.find(member => member.id === id) ?? null;
  });

  load(): void {
    this.loading.set(true);
    this.api.getTeamManagement().subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: TeamMemberTab): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.closeMemberMenu();
  }

  setZoneFilter(zone: string): void {
    this.zoneFilter.set(zone);
    this.currentPage.set(1);
    this.showZoneFilterMenu.set(false);
  }

  toggleZoneFilterMenu(): void {
    this.showZoneFilterMenu.update(open => !open);
  }

  closeZoneFilterMenu(): void {
    this.showZoneFilterMenu.set(false);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total) return;
    this.currentPage.set(page);
  }

  openMemberMenu(memberId: string): void {
    this.openMemberMenuId.set(memberId);
  }

  toggleMemberMenu(memberId: string): boolean {
    if (this.openMemberMenuId() === memberId) {
      this.closeMemberMenu();
      return false;
    }
    this.openMemberMenu(memberId);
    return true;
  }

  closeMemberMenu(): void {
    this.openMemberMenuId.set(null);
  }

  openAddMemberModal(): void {
    this.showAddMemberModal.set(true);
    this.closeMemberMenu();
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal.set(false);
  }

  openZoneAccessModal(): void {
    this.showZoneAccessModal.set(true);
    this.closeMemberMenu();
  }

  closeZoneAccessModal(): void {
    this.showZoneAccessModal.set(false);
  }

  openEditMemberModal(memberId: string): void {
    this.editingMemberId.set(memberId);
    this.closeMemberMenu();
  }

  closeEditMemberModal(): void {
    this.editingMemberId.set(null);
  }

  openFooterModal(modal: TeamFooterModal): void {
    this.footerModal.set(modal);
  }

  closeFooterModal(): void {
    this.footerModal.set(null);
  }

  addMember(payload: TeamMemberFormPayload): void {
    const initials = payload.name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const member: TeamMemberResponse = {
      id: `member-${Date.now()}`,
      initials: initials || 'TM',
      name: payload.name.trim(),
      email: payload.email.trim(),
      role: payload.role,
      zones: payload.zones.length ? payload.zones : ['global'],
      status: 'offline',
      tab: 'pending',
    };

    this.data.update(current => {
      if (!current) return current;
      return {
        ...current,
        members: [member, ...current.members],
        summary: this.buildSummary([member, ...current.members], current.zonePermissions),
      };
    });
    this.activeTab.set('pending');
    this.currentPage.set(1);
    this.closeAddMemberModal();
    this.persistSnapshot();
  }

  updateMember(memberId: string, payload: TeamMemberFormPayload): void {
    this.data.update(current => {
      if (!current) return current;
      const members = current.members.map(member => {
        if (member.id !== memberId) return member;
        return {
          ...member,
          name: payload.name.trim(),
          email: payload.email.trim(),
          role: payload.role,
          zones: payload.zones.length ? payload.zones : member.zones,
          extraZones: undefined,
        };
      });
      return {
        ...current,
        members,
        summary: this.buildSummary(members, current.zonePermissions),
      };
    });
    this.closeEditMemberModal();
    this.persistSnapshot();
  }

  archiveMember(memberId: string): void {
    this.patchMemberTab(memberId, 'archived', 'offline');
    this.closeMemberMenu();
  }

  restoreMember(memberId: string): void {
    this.patchMemberTab(memberId, 'all', 'active');
    this.closeMemberMenu();
  }

  removeMember(memberId: string): void {
    this.data.update(current => {
      if (!current) return current;
      const members = current.members.filter(member => member.id !== memberId);
      return {
        ...current,
        members,
        summary: this.buildSummary(members, current.zonePermissions),
      };
    });
    this.closeMemberMenu();
    this.closeEditMemberModal();
    this.persistSnapshot();
  }

  resendInvite(memberId: string): TeamMemberResponse | null {
    const member = this.data()?.members.find(item => item.id === memberId) ?? null;
    if (!member || member.tab !== 'pending') return null;

    this.data.update(current => {
      if (!current) return current;
      const members = current.members.map(item =>
        item.id === memberId ? { ...item, status: 'offline' as const } : item,
      );
      return { ...current, members };
    });
    this.closeMemberMenu();
    this.persistSnapshot();
    return member;
  }

  saveZonePermissions(permissions: ZonePermissionResponse[]): void {
    this.data.update(current => {
      if (!current) return current;
      return {
        ...current,
        zonePermissions: permissions,
        summary: this.buildSummary(current.members, permissions),
      };
    });
    this.closeZoneAccessModal();
    this.persistSnapshot();
  }

  private patchMemberTab(memberId: string, tab: TeamMemberTab, status: TeamMemberResponse['status']): void {
    this.data.update(current => {
      if (!current) return current;
      const members = current.members.map(member =>
        member.id === memberId ? { ...member, tab, status } : member,
      );
      return {
        ...current,
        members,
        summary: this.buildSummary(members, current.zonePermissions),
      };
    });
    this.persistSnapshot();
  }

  private persistSnapshot(): void {
    const payload = this.data();
    if (!payload) return;

    this.api.updateTeamManagement(payload).subscribe({
      next: saved => this.data.set(saved),
    });
  }

  private buildSummary(
    members: TeamMemberResponse[],
    zonePermissions: ZonePermissionResponse[],
  ): TeamManagementResponse['summary'] {
    const activeMembers = members.filter(member => member.tab !== 'archived');
    const administrators = activeMembers.filter(member => member.role === 'administrator').length;
    const enabledZones = zonePermissions.filter(permission => permission.enabled).length;

    return {
      totalMembers: activeMembers.length,
      membersTrendCount: Math.max(1, activeMembers.filter(member => member.tab === 'pending').length),
      administrators,
      administratorsLabelKey: 'teamManagement.summary.administratorsLabel',
      activeZones: enabledZones,
      activeZonesLabelKey: 'teamManagement.summary.activeZonesLabel',
      recentActivity: Math.max(12, activeMembers.length * 6),
      recentActivityLabelKey: 'teamManagement.summary.recentActivityLabel',
    };
  }
}
