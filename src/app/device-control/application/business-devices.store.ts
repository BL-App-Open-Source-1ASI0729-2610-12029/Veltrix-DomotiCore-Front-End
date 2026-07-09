import { Injectable, inject, signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import {
  BusinessDeviceCardResponse,

  BusinessDeviceTableRowResponse,

  BusinessDevicesOverviewResponse,

  BusinessZoneResponse,

} from '../infrastructure/business-devices-response';

import { BusinessDevicesApiService } from '../infrastructure/business-devices-api.service';
import { DeviceBulkControlApiService } from '../infrastructure/device-bulk-control-api.service';
import { AutomationApiService } from '../../automation/infrastructure/automation-api.service';
import { UiFeedbackService } from '../../shared/services/ui-feedback.service';



export interface BusinessDeviceLookup {

  zoneId: string;

  zoneName: string;

  deviceId: string;

  name: string;

  icon: string;

  active: boolean;

  loadKw: number;

  statusLabel: string;

  offline: boolean;

  source: 'card' | 'table';

}



@Injectable({ providedIn: 'root' })

export class BusinessDevicesStore {

  private readonly api = inject(BusinessDevicesApiService);
  private readonly bulkApi = inject(DeviceBulkControlApiService);
  private readonly automationApi = inject(AutomationApiService);
  private readonly feedback = inject(UiFeedbackService);



  readonly overview = signal<BusinessDevicesOverviewResponse | null>(null);

  readonly loading = signal(false);



  load(): Observable<BusinessDevicesOverviewResponse> {

    this.loading.set(true);



    return this.api.getOverview().pipe(

      tap({

        next: data => {

          this.overview.set(data);

          this.loading.set(false);

        },

        error: () => this.loading.set(false),

      }),

    );

  }



  findDevice(zoneId: string, deviceId: string): BusinessDeviceLookup | null {

    const overview = this.overview();

    if (!overview) return null;



    const zone = overview.zones.find(item => item.id === zoneId);

    if (!zone) return null;



    const card = zone.cards?.find(item => item.id === deviceId);

    if (card) {

      return this.toLookup(zone, card, 'card');

    }



    const row = zone.tableRows?.find(item => item.id === deviceId);

    if (row) {

      return this.toLookup(zone, row, 'table');

    }



    return null;

  }



  toggleCard(zoneId: string, deviceId: string): void {

    this.overview.update(current => {

      if (!current) return current;



      const zones = current.zones.map(zone => {

        if (zone.id !== zoneId || !zone.cards) return zone;



        return {

          ...zone,

          cards: zone.cards.map(card => {

            if (card.id !== deviceId || card.status === 'offline') return card;

            return { ...card, active: !card.active };

          }),

        };

      });



      return this.withRecalculatedTotals({ ...current, zones });

    });

    this.persistOverview();

  }



  toggleTableRow(zoneId: string, deviceId: string): void {

    this.overview.update(current => {

      if (!current) return current;



      const zones = current.zones.map(zone => {

        if (zone.id !== zoneId || !zone.tableRows) return zone;



        return {

          ...zone,

          tableRows: zone.tableRows.map(row => {

            if (row.id !== deviceId || row.status === 'OFFLINE') return row;

            return { ...row, active: !row.active };

          }),

        };

      });



      return this.withRecalculatedTotals({ ...current, zones });

    });

    this.persistOverview();

  }



  toggleDevice(zoneId: string, deviceId: string): void {

    const device = this.findDevice(zoneId, deviceId);

    if (!device || device.offline) return;



    if (device.source === 'card') {

      this.toggleCard(zoneId, deviceId);

      return;

    }



    this.toggleTableRow(zoneId, deviceId);

  }



  toggleLighting(zoneId: string): void {

    this.overview.update(current => {

      if (!current) return current;



      const zones = current.zones.map(zone => {

        if (zone.id !== zoneId || !zone.lightingGroup) return zone;



        const active = !zone.lightingGroup.active;

        return {

          ...zone,

          lightingGroup: {

            ...zone.lightingGroup,

            active,

            activeUnits: active ? zone.lightingGroup.totalUnits : 0,

          },

        };

      });



      return this.withRecalculatedTotals({ ...current, zones });

    });

    this.persistOverview();

  }



  turnAllOff(): string[] {
    const failed: string[] = [];

    this.overview.update(current => {
      if (!current) return current;

      const zones = current.zones.map(zone => ({
        ...zone,
        cards: zone.cards?.map(card => ({ ...card, active: false })),
        tableRows: zone.tableRows?.map(row => ({ ...row, active: false })),
        lightingGroup: zone.lightingGroup
          ? { ...zone.lightingGroup, active: false, activeUnits: 0 }
          : zone.lightingGroup,
      }));

      return this.withRecalculatedTotals({ ...current, zones });
    });

    if (this.bulkApi.hasApi()) {
      this.bulkApi.bulkToggle('off').subscribe(() => this.load().subscribe());
    } else {
      this.persistOverview();
    }

    return failed;
  }

  turnAllOn(): string[] {
    const failed: string[] = [];

    this.overview.update(current => {
      if (!current) return current;

      const zones = current.zones.map(zone => {
        zone.cards?.forEach(card => {
          if (card.status === 'offline') failed.push(card.name);
        });
        zone.tableRows?.forEach(row => {
          if (row.status === 'OFFLINE') failed.push(row.name);
        });

        return {
          ...zone,
          cards: zone.cards?.map(card =>
            card.status === 'offline' ? card : { ...card, active: true },
          ),
          tableRows: zone.tableRows?.map(row =>
            row.status === 'OFFLINE' ? row : { ...row, active: true, status: 'ACTIVE' as const },
          ),
          lightingGroup: zone.lightingGroup
            ? {
                ...zone.lightingGroup,
                active: true,
                activeUnits: zone.lightingGroup.totalUnits,
              }
            : zone.lightingGroup,
        };
      });

      return this.withRecalculatedTotals({ ...current, zones });
    });

    if (this.bulkApi.hasApi()) {
      this.bulkApi.bulkToggle('on').subscribe(() => this.load().subscribe());
    } else {
      this.persistOverview();
    }

    return [...new Set(failed)];
  }



  toggleDevicePriority(zoneId: string, deviceId: string): void {

    this.overview.update(current => {

      if (!current) return current;



      const zones = current.zones.map(zone => {

        if (zone.id !== zoneId) return zone;



        return {

          ...zone,

          cards: zone.cards?.map(card =>

            card.id === deviceId ? { ...card, isPriority: !card.isPriority } : card,

          ),

        };

      });



      return { ...current, zones };

    });

    this.persistOverview();

  }



  enableEcoMode(zoneId: string): void {

    this.overview.update(current => {

      if (!current) return current;



      const zones = current.zones.map(zone => {

        if (zone.id !== zoneId) return zone;



        return {

          ...zone,

          ecoModeEnabled: true,

          cards: zone.cards?.map(card => {

            const shouldPowerDown =

              card.active && !card.isPriority && card.loadKw >= 1.2 && card.status !== 'offline';



            return {

              ...card,

              active: shouldPowerDown ? false : card.active,

              loadKw: shouldPowerDown ? 0 : Number((card.loadKw * 0.85).toFixed(1)),

            };

          }),

          tableRows: zone.tableRows?.map(row => {

            const shouldPowerDown = row.active && row.loadKw >= 1.2 && row.status !== 'OFFLINE';



            return {

              ...row,

              active: shouldPowerDown ? false : row.active,

              status: shouldPowerDown ? ('STANDBY' as const) : row.status,

              loadKw: row.active ? Number((row.loadKw * 0.85).toFixed(1)) : row.loadKw,

            };

          }),

          lightingGroup: zone.lightingGroup

            ? {

                ...zone.lightingGroup,

                efficiencyPercent: Math.min(99, zone.lightingGroup.efficiencyPercent + 4),

              }

            : zone.lightingGroup,

        };

      });



      return this.withRecalculatedTotals({ ...current, zones });

    });

    if (this.bulkApi.hasApi()) {
      this.automationApi.activateEcoMode().subscribe(() => this.load().subscribe());
    } else {
      this.persistOverview();
    }

  }



  addDevice(payload: {
    id: string;
    name: string;
    icon: string;
    facilityZone: string;
  }): void {
    const businessZoneId = this.mapFacilityToBusinessZone(payload.facilityZone);
    const loadKw = payload.icon === 'acUnit' ? 2.0 : payload.icon === 'lightbulb' ? 0.6 : 0.4;

    this.overview.update(current => {
      if (!current) return current;

      const zones = current.zones.map(zone => {
        if (zone.id !== businessZoneId) return zone;

        if (zone.layout === 'table' && zone.tableRows) {
          return {
            ...zone,
            deviceCount: zone.deviceCount + 1,
            tableRows: [
              ...zone.tableRows,
              {
                id: payload.id,
                name: payload.name,
                status: 'ACTIVE' as const,
                loadKw,
                active: true,
              },
            ],
          };
        }

        if (zone.layout === 'cards' && zone.cards) {
          return {
            ...zone,
            deviceCount: zone.deviceCount + 1,
            cards: [
              ...zone.cards,
              {
                id: payload.id,
                name: payload.name,
                icon: payload.icon,
                status: 'active' as const,
                active: true,
                loadKw,
                metricLabel: 'Online',
              },
            ],
          };
        }

        return {
          ...zone,
          deviceCount: zone.deviceCount + 1,
        };
      });

      return this.withRecalculatedTotals({ ...current, zones });
    });

    this.persistOverview();
  }

  private mapFacilityToBusinessZone(facilityZone: string): string {
    if (facilityZone === 'loading-dock') return 'warehouse';
    return 'office';
  }

  addEnvironmentZone(name: string): void {

    const trimmed = name.trim();

    if (!trimmed) return;



    this.overview.update(current => {

      if (!current) return current;



      const zoneId = trimmed.toLowerCase().replace(/\s+/g, '-');

      const newZone: BusinessZoneResponse = {

        id: zoneId,

        name: trimmed,

        deviceCount: 0,

        layout: 'cards',

        cards: [],

        ecoPromoKey: 'businessDevices.zones.office.ecoPromo',

        ecoPromoCtaKey: 'businessDevices.zones.office.ecoCta',

      };



      return {

        ...current,

        zoneCount: current.zoneCount + 1,

        zones: [...current.zones, newZone],

      };

    });

    this.persistOverview();

  }



  private toLookup(

    zone: BusinessZoneResponse,

    device: BusinessDeviceCardResponse | BusinessDeviceTableRowResponse,

    source: 'card' | 'table',

  ): BusinessDeviceLookup {

    const offline =

      source === 'card'

        ? (device as BusinessDeviceCardResponse).status === 'offline'

        : (device as BusinessDeviceTableRowResponse).status === 'OFFLINE';



    const statusLabel =

      source === 'card'

        ? (device as BusinessDeviceCardResponse).metricLabel

        : (device as BusinessDeviceTableRowResponse).status;



    const icon = source === 'card' ? (device as BusinessDeviceCardResponse).icon : 'deviceHub';



    return {

      zoneId: zone.id,

      zoneName: zone.name,

      deviceId: device.id,

      name: device.name,

      icon,

      active: device.active,

      loadKw: device.loadKw,

      statusLabel,

      offline,

      source,

    };

  }



  private withRecalculatedTotals(

    overview: BusinessDevicesOverviewResponse,

  ): BusinessDevicesOverviewResponse {

    let totalConsumptionKw = 0;

    let activeDeviceCount = 0;



    for (const zone of overview.zones) {

      zone.cards?.forEach(card => {

        if (card.active && card.status !== 'offline') {

          totalConsumptionKw += card.loadKw;

          activeDeviceCount += 1;

        }

      });



      zone.tableRows?.forEach(row => {

        if (row.active && row.status !== 'OFFLINE') {

          totalConsumptionKw += row.loadKw;

          activeDeviceCount += 1;

        }

      });



      if (zone.lightingGroup?.active) {

        activeDeviceCount += zone.lightingGroup.activeUnits;

        totalConsumptionKw += Number((zone.lightingGroup.activeUnits * 0.05).toFixed(2));

      }

    }



    return {

      ...overview,

      activeDeviceCount,

      totalConsumptionKw: Number(totalConsumptionKw.toFixed(1)),

    };

  }

  private persistOverview(): void {
    const current = this.overview();
    if (!current || !this.api.hasApi()) return;

    const payload: BusinessDevicesOverviewResponse = {
      ...current,
      id: current.id ?? 'default',
    };

    this.api.updateOverview(payload).subscribe({
      next: data => this.overview.set(data),
      error: () => {
        this.feedback.showToast('No se pudo guardar el estado del dispositivo. Recargando…', 'error');
        this.load().subscribe();
      },
    });
  }

}

