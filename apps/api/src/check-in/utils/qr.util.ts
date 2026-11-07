import { createHash, randomBytes } from 'crypto';

export function hashQrToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newQrToken(): string {
  return randomBytes(24).toString('base64url');
}

export function qrRedisKey(siteId: string, tokenHash: string): string {
  return `checkin:qr:${siteId}:${tokenHash}`;
}

export function idempotencyRedisKey(key: string): string {
  return `checkin:idempotency:${key}`;
}

export function getQrTtlSeconds(): number {
  const raw = process.env.CHECKIN_QR_TTL_SECONDS;
  const n = raw ? Number(raw) : 60;
  return Number.isFinite(n) && n > 0 ? n : 60;
}
