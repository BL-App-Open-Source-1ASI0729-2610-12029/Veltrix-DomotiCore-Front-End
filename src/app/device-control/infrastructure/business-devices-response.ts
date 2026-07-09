export type BusinessZoneLayout = 'cards' | 'table' | 'mixed';
export type BusinessDeviceCardStatus = 'active' | 'offline';

export interface BusinessDeviceCardResponse {
  id: string;
  name: string;
  icon: string;
  status: BusinessDeviceCardStatus;
  active: boolean;
  loadKw: number;
  metricLabel: string;
  isPriority?: boolean;
  batteryPercent?: number | null;
}

export interface BusinessDeviceTableRowResponse {
  id: string;
  name: string;
  status: 'ACTIVE' | 'STANDBY' | 'OFFLINE';
  loadKw: number;
  active: boolean;
}

export interface BusinessLightingGroupResponse {
  active: boolean;
  activeUnits: number;
  totalUnits: number;
  efficiencyPercent: number;
  chartBars: number[];
}

export interface BusinessEnvironmentResponse {
  imageUrl: string;
  airQualityLabelKey: string;
  aqi: number;
  temperatureC: number;
}

export interface BusinessZoneResponse {
  id: string;
  name: string;
  deviceCount: number;
  layout: BusinessZoneLayout;
  cards?: BusinessDeviceCardResponse[];
  ecoPromoKey?: string;
  ecoPromoCtaKey?: string;
  ecoModeEnabled?: boolean;
  viewAllCount?: number;
  tableRows?: BusinessDeviceTableRowResponse[];
  lightingGroup?: BusinessLightingGroupResponse;
  environment?: BusinessEnvironmentResponse;
}

export interface BusinessDevicesOverviewResponse {
  id?: string;
  activeDeviceCount: number;
  zoneCount: number;
  totalConsumptionKw: number;
  zones: BusinessZoneResponse[];
}
