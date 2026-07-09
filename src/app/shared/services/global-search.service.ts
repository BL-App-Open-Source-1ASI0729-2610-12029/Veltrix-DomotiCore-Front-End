import { Injectable } from '@angular/core';

export type AccountSearchContext = 'smart-home' | 'small-business';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  resolveRoute(query: string, accountType: AccountSearchContext): string[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    if (accountType === 'small-business') {
      if (/team|user|member|staff|invite/.test(q)) return ['/app/users/team'];
      if (/report|cost|energy|audit/.test(q)) return ['/app/reports/cost-analysis'];
      if (/automation|rule|schedule|zone/.test(q)) return ['/app/automation/center'];
      if (/integration|api|webhook|service/.test(q)) return ['/app/smart-integrations/connected-services'];
      return ['/app/devices/explorer'];
    }

    if (/security|lock|camera|door|access|guest/.test(q)) return ['/app/security'];
    if (/device|light|climate|thermostat|sensor/.test(q)) return ['/app/devices'];
    if (/automation|scene|schedule|recipe/.test(q)) return ['/app/automation/center'];
    if (/energy|cost|report/.test(q)) return ['/app/history/energy'];
    return ['/app/history/notifications'];
  }
}
