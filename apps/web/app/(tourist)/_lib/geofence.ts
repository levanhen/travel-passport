import { DEMO_SKIP_GEOFENCE } from './demo';

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type GeofenceStatus = {
  distanceMeters: number;
  radiusMeters: number;
  withinGeofence: boolean;
};

export function checkGeofence(
  userLat: number,
  userLng: number,
  siteLat: number,
  siteLng: number,
  radiusMeters: number,
): GeofenceStatus {
  const distanceMeters = haversineMeters(userLat, userLng, siteLat, siteLng);
  if (DEMO_SKIP_GEOFENCE) {
    return { distanceMeters, radiusMeters, withinGeofence: true };
  }
  return {
    distanceMeters,
    radiusMeters,
    withinGeofence: distanceMeters <= radiusMeters,
  };
}

export function formatGeofenceMessage(status: GeofenceStatus): string {
  const dist = Math.round(status.distanceMeters);
  const radius = Math.round(status.radiusMeters);
  if (status.withinGeofence) {
    return `Bạn đang trong vùng check-in (~${dist}m / ${radius}m).`;
  }
  const extra = Math.max(1, Math.round(status.distanceMeters - status.radiusMeters));
  return `Bạn cách điểm ~${dist}m (cần trong ${radius}m). Di chuyển gần hơn khoảng ${extra}m.`;
}
