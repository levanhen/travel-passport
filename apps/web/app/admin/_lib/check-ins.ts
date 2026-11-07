import { DEFAULT_PAGE_SIZE, PagedResult } from '@/app/_lib/pagination';
import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type AdminCheckInRow = {
  id: string;
  checkedInAt: string;
  userPhoneMasked: string | null;
  proofLevel: string;
  evidenceFlags: string[];
  pointsAwarded: number;
  status: string;
};

export type AdminCheckInDetail = AdminCheckInRow & {
  siteId: string;
  siteName: string;
  userId: string;
  voidReason: string | null;
  voidedAt: string | null;
  voidedByEmail: string | null;
  participationLevel: string;
};

function token() {
  return getAccessToken();
}

export async function fetchSiteCheckInsPage(
  siteId: string,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
): Promise<PagedResult<AdminCheckInRow>> {
  return apiFetch(`/admin/sites/${siteId}/check-ins?page=${page}&limit=${limit}`, {
    accessToken: token(),
  });
}

export async function fetchSiteCheckIns(siteId: string): Promise<AdminCheckInRow[]> {
  const res = await fetchSiteCheckInsPage(siteId, 1, 50);
  return res.data;
}

export async function fetchCheckInDetail(id: string): Promise<AdminCheckInDetail> {
  const res = await apiFetch<{ data: AdminCheckInDetail }>(`/admin/check-ins/${id}`, {
    accessToken: token(),
  });
  return res.data;
}

export async function voidCheckIn(id: string, voidReason: string) {
  const res = await apiFetch<{ data: { id: string; status: string } }>(`/admin/check-ins/${id}`, {
    method: 'PATCH',
    accessToken: token(),
    body: JSON.stringify({ voidReason }),
  });
  return res.data;
}
