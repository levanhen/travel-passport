import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type AdminBadge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  destinationId: string | null;
  criteriaType: string;
  criteria: Record<string, unknown>;
  sortOrder: number;
};

function token() {
  return getAccessToken();
}

export async function fetchAdminBadges(): Promise<AdminBadge[]> {
  const res = await apiFetch<{ data: AdminBadge[] }>('/admin/badges', { accessToken: token() });
  return res.data;
}

export async function fetchAdminBadge(id: string): Promise<AdminBadge> {
  const res = await apiFetch<{ data: AdminBadge }>(`/admin/badges/${id}`, { accessToken: token() });
  return res.data;
}

export type CreateBadgeInput = {
  slug: string;
  name: string;
  description: string;
  destinationId?: string;
  criteriaType: string;
  criteria: Record<string, unknown>;
  sortOrder?: number;
};

export async function createBadge(input: CreateBadgeInput) {
  const res = await apiFetch<{ data: { id: string } }>('/admin/badges', {
    method: 'POST',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function patchBadge(
  id: string,
  input: {
    name?: string;
    description?: string;
    status?: string;
    criteria?: Record<string, unknown>;
    sortOrder?: number;
  },
) {
  const res = await apiFetch<{ data: { id: string } }>(`/admin/badges/${id}`, {
    method: 'PATCH',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}
