import { Injectable, computed, inject, signal } from '@angular/core';
import { TeamMemberRole } from '../infrastructure/team-management-response';
import {
  TeamMembershipApiService,
  TeamMembershipRecord,
} from '../infrastructure/team-membership-api.service';

const GLOBAL_ZONE_ALIASES = new Set([
  'global',
  'all',
  'mainoffice',
  'main-office',
  'hq',
  'headquarters',
]);

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
    if (this.hasGlobalAccess(membership.zones)) return true;

    const normalizedZone = this.normalize(zoneId);
    return membership.zones.some(zone => this.zoneMatches(this.normalize(zone), normalizedZone));
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

  private hasGlobalAccess(zones: string[]): boolean {
    return zones.some(zone => GLOBAL_ZONE_ALIASES.has(this.normalize(zone)));
  }

  private zoneMatches(memberZone: string, targetZone: string): boolean {
    if (memberZone === targetZone) return true;
    if (targetZone.includes(memberZone) || memberZone.includes(targetZone)) return true;

    switch (memberZone) {
      case 'mainoffice':
      case 'main-office':
      case 'hq':
      case 'headquarters':
        return targetZone === 'office' || targetZone === 'main-office' || targetZone === 'retail';
      case 'warehouse':
      case 'loading-dock':
      case 'loadingdock':
        return targetZone === 'warehouse' || targetZone.includes('warehouse') || targetZone.includes('loading');
      case 'office':
        return targetZone === 'office' || targetZone === 'main-office';
      case 'retail':
        return targetZone === 'retail';
      case 'living-room':
      case 'livingroom':
        return targetZone === 'living-room';
      case 'kitchen':
        return targetZone === 'kitchen';
      case 'master-bedroom':
      case 'masterbedroom':
      case 'bedroom':
        return targetZone === 'master-bedroom' || targetZone.includes('bedroom');
      default:
        return false;
    }
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/_/g, '-');
  }
}
