import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type AdminMerchant = {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  destinationId: string;
  address: string | null;
};

export type CreateMerchantInput = {
  organizationName: string;
  destinationId: string;
  merchant: { name: string; slug: string; category: string; address?: string };
  owner: { email: string; password: string };
};

function token() {
  return getAccessToken();
}

export async function fetchMerchants(destinationId?: string): Promise<AdminMerchant[]> {
  const qs = destinationId ? `?destinationId=${destinationId}` : '';
  const res = await apiFetch<{ data: AdminMerchant[] }>(`/admin/merchants${qs}`, {
    accessToken: token(),
  });
  return res.data;
}

export async function createMerchant(input: CreateMerchantInput) {
  const res = await apiFetch<{ data: AdminMerchant }>('/admin/merchants', {
    method: 'POST',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function patchMerchant(id: string, status: string) {
  const res = await apiFetch<{ data: AdminMerchant }>(`/admin/merchants/${id}`, {
    method: 'PATCH',
    accessToken: token(),
    body: JSON.stringify({ status }),
  });
  return res.data;
}
