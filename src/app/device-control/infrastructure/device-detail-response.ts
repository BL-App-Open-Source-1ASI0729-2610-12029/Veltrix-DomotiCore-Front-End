export type OperationMode = 'cool' | 'heat' | 'fan';
export type PowerChartPeriod = 'realtime' | 'day' | 'month';
export type DeviceDetailType = 'climate' | 'generic' | 'lighting';

import { ResourceAuditFields } from '../../shared/models/resource-audit.model';

export interface PowerChartPointResponse {
  label: string;
  value: number;
}

export interface DeviceAlertResponse {
  id: string;
  type: 'peak' | 'maintenance';
  title: string;
  message: string;
}

export interface DeviceDetailResponse extends ResourceAuditFields {
  id: string;
  roomId: string;
  roomName: string;
  name: string;
  icon: string;
  deviceType: DeviceDetailType;
  connection: 'online' | 'offline';
  active: boolean;
  currentTempC?: number;
  targetTempC?: number;
  operationMode?: OperationMode;
  ecoMode?: boolean;
  powerLoadKw: number;
  powerChartPeriod: PowerChartPeriod;
  powerChartPoints: PowerChartPointResponse[];
  fanSpeed?: string;
  swing?: string;
  humidityPercent?: number;
  scheduledTimer?: string | null;
  alerts: DeviceAlertResponse[];
  lastStateAt?: string;
  lastStateLabel?: string;
  batteryPercent?: number | null;
  brightnessPercent?: number;
}

export const FAN_SPEED_OPTIONS = ['Low', 'Medium', 'High', 'Auto', 'Auto High'] as const;
export const SWING_OPTIONS = ['Off', 'Vertical', 'Horizontal', 'Both'] as const;
export type FanSpeedOption = (typeof FAN_SPEED_OPTIONS)[number];
export type SwingOption = (typeof SWING_OPTIONS)[number];
