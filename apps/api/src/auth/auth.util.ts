import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

const WEAK_PINS = new Set([
  '000000',
  '111111',
  '222222',
  '333333',
  '444444',
  '555555',
  '666666',
  '777777',
  '888888',
  '999999',
  '123456',
  '654321',
  '012345',
]);

export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function normalizePhone(input: string): string | null {
  const raw = input.trim().replace(/[\s\-]/g, '');
  if (/^0\d{9}$/.test(raw)) return `+84${raw.slice(1)}`;
  if (/^\+84\d{9}$/.test(raw)) return raw;
  return null;
}

export function isWeakPin(pin: string): boolean {
  return !/^\d{6}$/.test(pin) || WEAK_PINS.has(pin);
}

export async function hashSecret(value: string): Promise<string> {
  return bcrypt.hash(value, 10);
}

export async function verifySecret(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}

/** Constant-time-ish dummy compare when user missing */
export async function dummyPinVerify(pin: string): Promise<void> {
  await bcrypt.compare(pin, '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV');
}

export async function dummyPasswordVerify(password: string): Promise<void> {
  await bcrypt.compare(password, '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV');
}

export function hashDeviceId(deviceId: string): string {
  return createHash('sha256').update(deviceId).digest('hex');
}

export function newRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(48).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
