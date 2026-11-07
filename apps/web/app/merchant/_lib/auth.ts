'use client';

import { apiFetch, ApiRequestError } from './api';

export const ACCESS_TOKEN_KEY = 'tp_merchant_access_token';

export type StaffUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  orgId: string | null;
  phoneVerified: boolean;
  profile: { displayName: string; avatarUrl: string | null } | null;
};

export type SessionPayload = {
  accessToken: string;
  user: StaffUser;
};

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
}

export function clearSession() {
  setAccessToken(null);
}

export async function staffLogin(email: string, password: string): Promise<SessionPayload> {
  const res = await apiFetch<{ data: SessionPayload }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveSession(res.data);
  return res.data;
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

export async function fetchMe(): Promise<StaffUser | null> {
  let token = getAccessToken();
  if (!token) {
    const refreshed = await refreshSession();
    token = refreshed?.accessToken ?? null;
  }
  if (!token) return null;
  try {
    const res = await apiFetch<{ data: { user: StaffUser } }>('/auth/me', {
      accessToken: token,
    });
    return res.data.user;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 401) {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
      const res = await apiFetch<{ data: { user: StaffUser } }>('/auth/me', {
        accessToken: refreshed.accessToken,
      });
      return res.data.user;
    }
    throw e;
  }
}

export { ApiRequestError };
