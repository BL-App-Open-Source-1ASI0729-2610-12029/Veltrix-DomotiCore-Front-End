import { Injectable, computed, inject, signal } from '@angular/core';
import { TeamMemberRole } from '../infrastructure/team-management-response';
import {
  TeamMembershipApiService,
  TeamMembershipRecord,
} from '../infrastructure/team-membership-api.service';

@Injectable({ providedIn: 'root' })
export class TeamMembershipService {
  private readonly api = inject(TeamMembershipApiService);

  readonly memberships = signal<TeamMembershipRecord[]>([]);

  readonly activeMembership = computed(() =>
    this.memberships().find(item => item.status === 'active') ?? null,
  );

  sync(): void {
    this.api.getMine().subscribe({
      next: snapshot => {
        this.memberships.set(
          (snapshot.memberships ?? []).filter(item => item.status === 'active'),
        );
      },
    });
  }

  hasActiveMembership(): boolean {
    return this.activeMembership() != null;
  }

  canAccessZone(zoneId: string): boolean {
    const membership = this.activeMembership();
    if (!membership) return true;
    if (membership.zones.includes('global')) return true;

    const normalizedZone = zoneId.toLowerCase();
    return membership.zones.some(zone => {
      const normalized = zone.toLowerCase();
      return (
        normalized === normalizedZone ||
        normalizedZone.includes(normalized) ||
        normalized.includes(normalizedZone)
      );
    });
  }

  canControlDevices(zoneId?: string): boolean {
    const membership = this.activeMembership();
    if (!membership) return true;
    if (zoneId && !this.canAccessZone(zoneId)) return false;
    return membership.teamRole !== 'viewer';
  }

  teamRoleLabel(): TeamMemberRole | null {
    return this.activeMembership()?.teamRole ?? null;
  }
}
