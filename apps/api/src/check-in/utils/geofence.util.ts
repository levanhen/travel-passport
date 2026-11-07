const EARTH_RADIUS_M = 6371000;

export function isGeofenceSkipped(): boolean {
  return process.env.CHECKIN_SKIP_GEOFENCE === 'true';
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function geofenceCheck(
  latitude: number,
  longitude: number,
  siteLat: number,
  siteLng: number,
  radiusMeters: number,
): { withinGeofence: boolean; distanceMeters: number } {
  const distanceMeters = haversineMeters(latitude, longitude, siteLat, siteLng);
  if (isGeofenceSkipped()) {
    return { withinGeofence: true, distanceMeters };
  }
  return { withinGeofence: distanceMeters <= radiusMeters, distanceMeters };
}
