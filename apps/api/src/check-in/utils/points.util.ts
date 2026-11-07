export const GPS_POINTS = 25;
export const QR_POINTS = 50;
export const PHOTO_POINTS = 15;

export type EvidenceFlag = 'gps' | 'qr' | 'photo';

export function computePointsFromFlags(
  flags: EvidenceFlag[],
  gpsInGeofence: boolean,
): number {
  let total = 0;
  if (flags.includes('gps') && gpsInGeofence) total += GPS_POINTS;
  if (flags.includes('qr')) total += QR_POINTS;
  if (flags.includes('photo')) total += PHOTO_POINTS;
  return total;
}

export function levelFromBalance(balance: number): 'TRAVELLER' | 'EXPLORER' | 'LOCAL_INSIDER' {
  if (balance >= 2000) return 'LOCAL_INSIDER';
  if (balance >= 500) return 'EXPLORER';
  return 'TRAVELLER';
}
