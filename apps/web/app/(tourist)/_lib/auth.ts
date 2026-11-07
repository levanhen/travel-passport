'use client';

import { apiFetch, ApiRequestError } from './api';

export const DEVICE_ID_KEY = 'tp_device_id';
export const PHONE_KEY = 'tp_phone';
export const ACCESS_TOKEN_KEY = 'tp_access_token';
export const LEGAL_POLICY_VERSION =
  process.env.NEXT_PUBLIC_LEGAL_POLICY_VERSION ?? '2026-09-01';

export type TouristUser = {
  id: string;
  phone: string | null;
  role: string;
  orgId: null;
  phoneVerified: boolean;
  profile: { displayName: string; avatarUrl: string | null } | null;
};

export type SessionPayload = {
  accessToken: string;
  user: TouristUser;
};

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getStoredPhone(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PHONE_KEY);
}

export function setStoredPhone(phone: string) {
  localStorage.setItem(PHONE_KEY, phone);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function saveSession(session: SessionPayload) {
  setAccessToken(session.accessToken);
  if (session.user.phone) setStoredPhone(session.user.phone);
}

export function clearSession() {
  setAccessToken(null);
}

export async function touristStart(phone: string) {
  const deviceId = getDeviceId();
  try {
    const res = await apiFetch<{ data: SessionPayload | { next: 'set_pin' } }>(
      '/auth/tourist/start',
      {
        method: 'POST',
        body: JSON.stringify({ phone, deviceId }),
      },
    );
    return { ok: true as const, status: 200, data: res.data };
  } catch (e) {
    if (e instanceof ApiRequestError) {
      if (e.status === 202) {
        // unlikely via throw path
      }
      return { ok: false as const, status: e.status, code: e.code, message: e.message };
    }
    throw e;
  }
}

/** start returns 202 without throwing when using raw fetch for status */
export async function touristStartRaw(phone: string): Promise<
  | { kind: 'session'; session: SessionPayload }
  | { kind: 'set_pin' }
  | { kind: 'unlock'; code: string; message: string }
  | { kind: 'error'; code: string; message: string; status: number }
> {
  const deviceId = getDeviceId();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${API_BASE}/api/v1/auth/tourist/start`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, deviceId }),
  });
  const json = await res.json();

  if (res.status === 202) return { kind: 'set_pin' };
  if (res.status === 200) {
    const session = json.data as SessionPayload;
    saveSession(session);
    setStoredPhone(phone);
    return { kind: 'session', session };
  }
  if (res.status === 401 && json.error?.code === 'AUTH_PIN_REQUIRED') {
    setStoredPhone(phone);
    return { kind: 'unlock', code: json.error.code, message: json.error.message };
  }
  return {
    kind: 'error',
    code: json.error?.code ?? 'UNKNOWN',
    message: json.error?.message ?? 'Đã xảy ra lỗi.',
    status: res.status,
  };
}

export async function touristSetPin(phone: string, pin: string) {
  const deviceId = getDeviceId();
  const acceptedAt = new Date().toISOString();
  const session = await apiFetch<{ data: SessionPayload }>('/auth/tourist/set-pin', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      deviceId,
      pin,
      consent: {
        termsVersion: LEGAL_POLICY_VERSION,
        privacyVersion: LEGAL_POLICY_VERSION,
        acceptedAt,
      },
    }),
  });
  saveSession(session.data);
  setStoredPhone(phone);
  return session.data;
}

export async function touristUnlock(phone: string, pin: string) {
  const deviceId = getDeviceId();
  const session = await apiFetch<{ data: SessionPayload }>('/auth/tourist/unlock', {
    method: 'POST',
    body: JSON.stringify({ phone, deviceId, pin }),
  });
  saveSession(session.data);
  setStoredPhone(phone);
  return session.data;
}

export async function refreshSession(): Promise<SessionPayload | null> {
  try {
    const res = await apiFetch<{ data: SessionPayload }>('/auth/refresh', { method: 'POST' });
    saveSession(res.data);
    return res.data;
  } catch {
    clearSession();
    return null;
  }
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    clearSession();
  }
}

export async function fetchMe(): Promise<TouristUser | null> {
  let token = getAccessToken();
  if (!token) {
    const refreshed = await refreshSession();
    token = refreshed?.accessToken ?? null;
  }
  if (!token) return null;
  try {
    const res = await apiFetch<{ data: { user: TouristUser } }>('/auth/me', {
      accessToken: token,
    });
    return res.data.user;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 401) {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
      const res = await apiFetch<{ data: { user: TouristUser } }>('/auth/me', {
        accessToken: refreshed.accessToken,
      });
      return res.data.user;
    }
    throw e;
  }
}
