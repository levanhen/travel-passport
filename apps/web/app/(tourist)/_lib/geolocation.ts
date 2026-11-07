import { DEMO_SKIP_GEOFENCE } from './demo';

export async function getCheckinCoordinates(fallback?: {
  lat: number;
  lng: number;
}): Promise<{ lat: number; lng: number; accuracy: number }> {
  if (DEMO_SKIP_GEOFENCE && fallback) {
    return { lat: fallback.lat, lng: fallback.lng, accuracy: 10 };
  }

  if (!navigator.geolocation) {
    throw new Error('no geo');
  }

  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    }),
  );

  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}
