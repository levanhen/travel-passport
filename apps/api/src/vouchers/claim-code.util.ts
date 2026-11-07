import { randomBytes } from 'crypto';

export function generateClaimCode(): string {
  const part = randomBytes(3).toString('hex').toUpperCase();
  return `TP-${part}`;
}

export function claimQrPayload(claimCode: string): string {
  return `tp://voucher?claim=${claimCode}`;
}
