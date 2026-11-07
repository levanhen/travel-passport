import { apiFetch } from './api';
import { getAccessToken, getDeviceId } from './auth';

export type CheckinResult = {
  checkin: {
    id: string;
    siteId: string;
    siteName: string;
    proofLevel: string;
    evidenceFlags: string[];
    pointsAwarded: number;
    status: string;
    checkedInAt: string;
    upgradeExpiresAt: string;
    canAddEvidence: { qr: boolean; photo: boolean };
  };
  rewards: {
    pointsAwarded: number;
    pointsDelta: number;
    balance: number;
    level: string;
    badgesUnlocked: { id: string; slug: string; name: string }[];
  };
};

export async function createCatalogCheckin(
  siteId: string,
  latitude: number,
  longitude: number,
  accuracyMeters?: number,
): Promise<CheckinResult> {
  const token = getAccessToken();
  const idempotencyKey = crypto.randomUUID();
  const res = await apiFetch<{ data: CheckinResult }>('/check-ins/self', {
    method: 'POST',
    accessToken: token,
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      siteId,
      latitude,
      longitude,
      accuracyMeters,
      deviceId: getDeviceId(),
    }),
  });
  return res.data;
}

export async function createPartnerCheckin(
  siteId: string,
  latitude: number,
  longitude: number,
  accuracyMeters?: number,
  qrToken?: string,
): Promise<CheckinResult> {
  const token = getAccessToken();
  const idempotencyKey = crypto.randomUUID();
  const res = await apiFetch<{ data: CheckinResult }>('/check-ins', {
    method: 'POST',
    accessToken: token,
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      siteId,
      latitude,
      longitude,
      accuracyMeters,
      deviceId: getDeviceId(),
      qrToken: qrToken ?? null,
    }),
  });
  return res.data;
}

export async function fetchCheckin(id: string): Promise<CheckinResult['checkin']> {
  const token = getAccessToken();
  const res = await apiFetch<{ data: CheckinResult['checkin'] }>(`/check-ins/${id}`, {
    accessToken: token,
  });
  return res.data;
}

export type CheckinListItem = CheckinResult['checkin'];

export async function fetchCheckinsPage(
  page = 1,
  limit = 20,
): Promise<{ data: CheckinListItem[]; meta: { page: number; limit: number; total: number } }> {
  const token = getAccessToken();
  return apiFetch(`/check-ins?page=${page}&limit=${limit}`, { accessToken: token });
}

/** Trang đầu (tối đa 50) — dùng khi chỉ cần check-in gần đây */
export async function fetchCheckins(): Promise<CheckinListItem[]> {
  const res = await fetchCheckinsPage(1, 50);
  return res.data;
}

export async function addQrEvidence(
  checkinId: string,
  latitude: number,
  longitude: number,
  qrToken?: string,
): Promise<CheckinResult> {
  const token = getAccessToken();
  const res = await apiFetch<{ data: CheckinResult }>(`/check-ins/${checkinId}/evidence`, {
    method: 'POST',
    accessToken: token,
    body: JSON.stringify({
      type: 'qr',
      qrToken,
      latitude,
      longitude,
      deviceId: getDeviceId(),
    }),
  });
  return res.data;
}

export async function addPhotoEvidence(checkinId: string, file: Blob): Promise<CheckinResult> {
  const token = getAccessToken();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const form = new FormData();
  form.append('type', 'photo');
  form.append('deviceId', getDeviceId());
  form.append('photo', file, 'checkin.jpg');

  const res = await fetch(`${API_BASE}/api/v1/check-ins/${checkinId}/evidence`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'Upload ảnh thất bại.');
  }
  return json.data as CheckinResult;
}
