import { apiFetch } from './api';
import { getAccessToken } from './auth';

export const PILOT_DESTINATION_SLUG =
  process.env.NEXT_PUBLIC_PILOT_DESTINATION_SLUG ?? 'da-nang';

export type AdminSite = {
  id: string;
  destinationId: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  participationLevel: 'catalog' | 'partner';
  checkInMethod: 'self' | 'qr';
  category: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  checkInEnabled: boolean;
  staticQrEnabled: boolean;
  qrMode: string | null;
  status: string;
  operatorName: string | null;
};

export type Destination = {
  id: string;
  name: string;
  slug: string;
};

function token() {
  return getAccessToken();
}

export async function fetchPilotDestination(): Promise<Destination> {
  const res = await apiFetch<{ data: Destination[] }>('/destinations');
  const dest = res.data.find((d) => d.slug === PILOT_DESTINATION_SLUG);
  if (!dest) throw new Error('Không tìm thấy destination pilot.');
  return dest;
}

export async function fetchAdminSites(
  destinationId: string,
  filters?: { participationLevel?: string; category?: string },
): Promise<AdminSite[]> {
  const params = new URLSearchParams();
  if (filters?.participationLevel) params.set('participationLevel', filters.participationLevel);
  if (filters?.category) params.set('category', filters.category);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch<{ data: AdminSite[] }>(`/destinations/${destinationId}/sites${qs}`, {
    accessToken: token(),
  });
  return res.data;
}

export async function fetchAdminSite(id: string): Promise<AdminSite> {
  const res = await apiFetch<{ data: AdminSite }>(`/sites/${id}`, { accessToken: token() });
  return res.data;
}

export type CreateSiteInput = {
  participationLevel: 'catalog' | 'partner';
  destinationId: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
  address?: string;
  geofenceRadiusMeters?: number;
  staticQrEnabled?: boolean;
  organizationId?: string;
  qrMode?: string;
  status?: string;
};

export async function createSite(input: CreateSiteInput): Promise<AdminSite> {
  const res = await apiFetch<{ data: AdminSite }>('/admin/sites', {
    method: 'POST',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function patchSite(
  id: string,
  input: Partial<CreateSiteInput & { checkInEnabled?: boolean }>,
): Promise<AdminSite> {
  const res = await apiFetch<{ data: AdminSite }>(`/admin/sites/${id}`, {
    method: 'PATCH',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}
