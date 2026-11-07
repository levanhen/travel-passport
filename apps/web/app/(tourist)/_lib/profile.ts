'use client';

import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type TouristProfile = {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  phoneMasked: string | null;
  phoneVerified: boolean;
  level: string;
  levelLabel: string;
  pointsBalance: number;
};

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');
  return fn(token);
}

export async function fetchProfile(): Promise<TouristProfile> {
  return withToken(async (token) => {
    const res = await apiFetch<{ data: TouristProfile }>('/profile', { accessToken: token });
    return res.data;
  });
}

export async function updateProfile(input: {
  displayName?: string;
  bio?: string;
}): Promise<TouristProfile> {
  return withToken(async (token) => {
    const res = await apiFetch<{ data: TouristProfile }>('/profile', {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(input),
    });
    return res.data;
  });
}

export async function changePin(oldPin: string, newPin: string): Promise<void> {
  return withToken(async (token) => {
    await apiFetch<void>('/auth/tourist/change-pin', {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify({ oldPin, newPin }),
    });
  });
}
