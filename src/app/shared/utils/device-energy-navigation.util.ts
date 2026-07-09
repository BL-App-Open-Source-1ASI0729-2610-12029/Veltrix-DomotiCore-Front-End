export interface DeviceEnergyRoute {
  zoneOrRoom: string;
  deviceId: string;
}

const SMART_HOME_ENERGY_ROUTES: Record<string, DeviceEnergyRoute> = {
  hvac: { zoneOrRoom: 'living-room', deviceId: 'smart-ac' },
  fridge: { zoneOrRoom: 'kitchen', deviceId: 'fridge' },
  washer: { zoneOrRoom: 'laundry', deviceId: 'washer' },
  lighting: { zoneOrRoom: 'living-room', deviceId: 'ceiling-lights' },
  entertainment: { zoneOrRoom: 'living-room', deviceId: 'tv-stand' },
  other: { zoneOrRoom: 'living-room', deviceId: 'smart-plug' },
};

const BUSINESS_REPORT_ROUTES: Record<string, DeviceEnergyRoute> = {
  d1: { zoneOrRoom: 'office', deviceId: 'ac-main' },
  d2: { zoneOrRoom: 'office', deviceId: 'lights-overhead' },
  d3: { zoneOrRoom: 'office', deviceId: 'server-rack-b' },
};

export function resolveSmartHomeEnergyRoute(deviceId: string): string[] | null {
  const route = SMART_HOME_ENERGY_ROUTES[deviceId];
  if (!route) return null;
  return ['/app/devices', route.zoneOrRoom, route.deviceId];
}

export function resolveBusinessReportRoute(deviceId: string): string[] | null {
  const route = BUSINESS_REPORT_ROUTES[deviceId];
  if (!route) return null;
  return ['/app/devices', route.zoneOrRoom, route.deviceId];
}
