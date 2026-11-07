import { Checkin, CheckinEvidence, TourismSite } from '@tp/db';
import { computePointsFromFlags, EvidenceFlag } from './utils/points.util';

export type CanAddEvidence = { qr: boolean; photo: boolean };

export type CheckinReadModel = {
  id: string;
  siteId: string;
  siteName: string;
  destinationId: string;
  participationLevel: string;
  proofLevel: string;
  evidenceFlags: string[];
  pointsAwarded: number;
  status: string;
  checkedInAt: string;
  upgradeExpiresAt: string;
  canAddEvidence: CanAddEvidence;
};

export type RewardsReadModel = {
  pointsAwarded: number;
  pointsDelta: number;
  balance: number;
  level: string;
  badgesUnlocked: { id: string; slug: string; name: string }[];
};

export function computeCanAddEvidence(
  checkin: Checkin,
  site: TourismSite,
  now = new Date(),
): CanAddEvidence {
  if (checkin.status !== 'confirmed') return { qr: false, photo: false };
  if (now > checkin.upgradeExpiresAt) return { qr: false, photo: false };

  const flags = checkin.evidenceFlags;
  const qrSupported =
    site.participationLevel === 'partner' ||
    (site.participationLevel === 'catalog' && site.staticQrEnabled);

  return {
    qr: qrSupported && !flags.includes('qr'),
    photo: !flags.includes('photo'),
  };
}

export function toCheckinReadModel(
  checkin: Checkin & { tourismSite: TourismSite },
  now = new Date(),
): CheckinReadModel {
  return {
    id: checkin.id,
    siteId: checkin.tourismSiteId,
    siteName: checkin.tourismSite.name,
    destinationId: checkin.destinationId,
    participationLevel: checkin.participationLevel,
    proofLevel: checkin.proofLevel,
    evidenceFlags: checkin.evidenceFlags,
    pointsAwarded: checkin.pointsAwarded,
    status: checkin.status,
    checkedInAt: checkin.checkedInAt.toISOString(),
    upgradeExpiresAt: checkin.upgradeExpiresAt.toISOString(),
    canAddEvidence: computeCanAddEvidence(checkin, checkin.tourismSite, now),
  };
}

export function computeTotalPoints(flags: EvidenceFlag[], gpsInGeofence: boolean): number {
  return computePointsFromFlags(flags, gpsInGeofence);
}
