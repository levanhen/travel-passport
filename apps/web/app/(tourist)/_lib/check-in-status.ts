import { CheckinListItem } from './check-in';

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function findTodayCheckinForSite(
  checkins: CheckinListItem[],
  siteId: string,
): CheckinListItem | null {
  const now = new Date();
  return (
    checkins.find(
      (c) => c.siteId === siteId && isSameLocalDay(new Date(c.checkedInAt), now),
    ) ?? null
  );
}

export function upgradeLinkForCheckin(checkin: CheckinListItem): string | null {
  if (checkin.canAddEvidence.qr) {
    return `/check-in/scan?checkinId=${checkin.id}`;
  }
  if (checkin.canAddEvidence.photo) {
    return `/check-ins/${checkin.id}/upgrade?type=photo`;
  }
  return null;
}
