import {
  Destination,
  Organization,
  ParticipationLevel,
  TourismSite,
} from '@tp/db';

export type SiteReadModel = {
  id: string;
  destinationId: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  participationLevel: ParticipationLevel;
  checkInMethod: 'self' | 'qr';
  category: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  checkInEnabled: boolean;
  staticQrEnabled: boolean;
  qrMode: string | null;
  status: string;
  operatorName: string | null;
};

function toNumber(value: { toString(): string }): number {
  return Number(value.toString());
}

export function toSiteReadModel(
  site: TourismSite & { organization?: Organization | null },
): SiteReadModel {
  const isPartner = site.participationLevel === ParticipationLevel.partner;
  return {
    id: site.id,
    destinationId: site.destinationId,
    name: site.name,
    slug: site.slug,
    description: site.description,
    address: site.address,
    participationLevel: site.participationLevel,
    checkInMethod: isPartner ? 'qr' : 'self',
    category: site.category,
    latitude: toNumber(site.latitude),
    longitude: toNumber(site.longitude),
    geofenceRadiusMeters: site.geofenceRadiusMeters,
    checkInEnabled: site.checkInEnabled,
    staticQrEnabled: site.staticQrEnabled,
    qrMode: site.qrMode,
    status: site.status,
    operatorName: site.organization?.name ?? null,
  };
}

export type DestinationReadModel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
};

export function toDestinationReadModel(dest: Destination): DestinationReadModel {
  return {
    id: dest.id,
    name: dest.name,
    slug: dest.slug,
    description: dest.description,
    status: dest.status,
  };
}
