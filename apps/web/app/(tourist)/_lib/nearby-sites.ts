import { checkGeofence } from './geofence';
import { Site } from './sites';

export type NearbySiteMatch = {
  site: Site;
  distanceMeters: number;
  withinGeofence: boolean;
};

export function rankSitesByProximity(
  sites: Site[],
  userLat: number,
  userLng: number,
): NearbySiteMatch[] {
  return sites
    .filter((s) => s.checkInEnabled && s.status === 'published')
    .map((site) => {
      const geo = checkGeofence(
        userLat,
        userLng,
        site.latitude,
        site.longitude,
        site.geofenceRadiusMeters,
      );
      return {
        site,
        distanceMeters: geo.distanceMeters,
        withinGeofence: geo.withinGeofence,
      };
    })
    .sort((a, b) => {
      if (a.withinGeofence !== b.withinGeofence) {
        return a.withinGeofence ? -1 : 1;
      }
      return a.distanceMeters - b.distanceMeters;
    });
}

export const NEARBY_QUICK_LIMIT = 3;

export function topNearbySites(
  matches: NearbySiteMatch[],
  limit = NEARBY_QUICK_LIMIT,
): NearbySiteMatch[] {
  return matches.slice(0, limit);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
