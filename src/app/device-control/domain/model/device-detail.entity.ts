import {
  DeviceAlertResponse,
  DeviceDetailType,
  OperationMode,
  PowerChartPeriod,
  PowerChartPointResponse,
} from '../../infrastructure/device-detail-response';

export interface DeviceDetail {
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

  return {
    id,
    roomId,
    roomName,
    name,
    icon,
    deviceType,
    connection: 'online',
    active: false,
    currentTempC: isClimate ? 22.5 : 0,
    targetTempC: isClimate ? 21 : 0,
    operationMode: 'cool',
    ecoMode: false,
    powerLoadKw: 0,
    powerChartPeriod: 'realtime',
    powerChartPoints: isClimate
      ? [
          { label: '14:00', value: 0 },
          { label: '15:00', value: 0.4 },
          { label: '16:00', value: 0.8 },
          { label: '17:00', value: 1.1 },
          { label: 'NOW', value: 0 },
        ]
      : [{ label: 'NOW', value: 0 }],
    fanSpeed: isClimate ? 'Auto' : '—',
    swing: isClimate ? 'Off' : '—',
    humidityPercent: isClimate ? 45 : 0,
    scheduledTimer: null,
    alerts: [],
    lastStateAt: new Date().toISOString(),
    lastStateLabel: 'Standby',
  };
}
