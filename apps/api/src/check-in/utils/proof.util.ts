import { ProofLevel } from '@tp/db';

export type EvidenceSnapshot = {
  type: 'gps' | 'qr' | 'photo';
  withinGeofence: boolean | null;
};

export function evidenceFlagsFromSnapshots(evidences: EvidenceSnapshot[]): string[] {
  const flags: string[] = [];
  if (evidences.some((e) => e.type === 'gps')) flags.push('gps');
  if (evidences.some((e) => e.type === 'qr')) flags.push('qr');
  if (evidences.some((e) => e.type === 'photo')) flags.push('photo');
  return flags;
}

export function computeProofLevel(evidences: EvidenceSnapshot[]): ProofLevel {
  const gps = evidences.find((e) => e.type === 'gps');
  const qr = evidences.find((e) => e.type === 'qr');
  const gpsInGeofence = gps?.withinGeofence === true;
  const hasQr = Boolean(qr);

  if (gpsInGeofence && hasQr) {
    const qrInGeofence = qr!.withinGeofence !== false;
    return qrInGeofence ? ProofLevel.L2 : ProofLevel.L1;
  }
  if (hasQr) return ProofLevel.L1;
  return ProofLevel.L0;
}

export function proofLevelRank(level: ProofLevel): number {
  switch (level) {
    case ProofLevel.L0:
      return 0;
    case ProofLevel.L1:
      return 1;
    case ProofLevel.L2:
      return 2;
    default:
      return 0;
  }
}

export function meetsMinProofLevel(actual: ProofLevel, min: ProofLevel): boolean {
  return proofLevelRank(actual) >= proofLevelRank(min);
}
