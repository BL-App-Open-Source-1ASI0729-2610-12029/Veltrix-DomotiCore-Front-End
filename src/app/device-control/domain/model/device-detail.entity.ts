import {
  DeviceAlertResponse,
  DeviceDetailType,
  OperationMode,
  PowerChartPeriod,
  PowerChartPointResponse,
} from '../../infrastructure/device-detail-response';
import { ResourceAuditFields } from '../../../shared/models/resource-audit.model';

export interface DeviceDetail extends ResourceAuditFields {
  id: string;
  roomId: string;
  roomName: string;
  name: string;
  icon: string;
  deviceType: DeviceDetailType;
  connection: 'online' | 'offline';
  active: boolean;
  currentTempC: number;
  targetTempC: number;
  operationMode: OperationMode;
  ecoMode: boolean;
  powerLoadKw: number;
  powerChartPeriod: PowerChartPeriod;
  powerChartPoints: PowerChartPointResponse[];
  fanSpeed: string;
  swing: string;
  humidityPercent: number;
  scheduledTimer: string | null;
  alerts: DeviceAlertResponse[];
  lastStateAt?: string;
  lastStateLabel?: string;
  batteryPercent?: number | null;
  brightnessPercent?: number;
}

export function createDefaultDeviceDetail(
  id: string,
  roomId: string,
  roomName: string,
  name: string,
  icon: string,
  deviceType: DeviceDetailType,
): DeviceDetail {
  const isClimate = deviceType === 'climate';
  const isLighting = deviceType === 'lighting';

  return {
    id,
    roomId,
    roomName,
    name,
    icon,
    deviceType,
    connection: 'online',
    active: isLighting,
    currentTempC: isClimate ? 22.5 : 0,
    targetTempC: isClimate ? 21 : 0,
    operationMode: 'cool',
    ecoMode: false,
    powerLoadKw: isLighting ? 0.045 : 0,
    powerChartPeriod: 'realtime',
    powerChartPoints: isClimate
      ? [
          { label: '14:00', value: 0 },
          { label: '15:00', value: 0.4 },
          { label: '16:00', value: 0.8 },
          { label: '17:00', value: 1.1 },
          { label: 'NOW', value: 0 },
        ]
      : isLighting
        ? [
            { label: '18:00', value: 0.02 },
            { label: '19:00', value: 0.03 },
            { label: '20:00', value: 0.04 },
            { label: 'NOW', value: 0.045 },
          ]
        : [{ label: 'NOW', value: 0 }],
    fanSpeed: isClimate ? 'Auto' : '—',
    swing: isClimate ? 'Off' : '—',
    humidityPercent: isClimate ? 45 : 0,
    scheduledTimer: null,
    alerts: [],
    lastStateAt: new Date().toISOString(),
    lastStateLabel: isLighting ? 'Warm white 80%' : 'Standby',
    brightnessPercent: isLighting ? 80 : undefined,
  };
}
