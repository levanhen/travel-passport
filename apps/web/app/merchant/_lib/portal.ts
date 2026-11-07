import { DEFAULT_PAGE_SIZE, PagedResult } from '@/app/_lib/pagination';
import { apiFetch } from './api';
import { getAccessToken } from './auth';

function token() {
  return getAccessToken();
}

export type MerchantDashboard = {
  totalClaims: number;
  totalRedemptions: number;
  redemptionsToday: number;
  activeVouchers: number;
};

export type MerchantVoucher = {
  id: string;
  title: string;
  description: string | null;
  discountLabel: string;
  minLevel: string;
  minBalance: number;
  costPoints: number;
  quotaTotal: number | null;
  validFrom: string;
  validUntil: string;
  status: string;
  redemptionsCount?: number;
};

export type ClaimLookup = {
  claimCode: string;
  status: string;
  voucherTitle: string;
  discountLabel: string;
  expiresAt: string;
  canRedeem: boolean;
};

export type RedemptionRow = {
  id: string;
  claimCode: string;
  voucherTitle: string;
  redeemedAt: string;
};

export type MerchantBusiness = {
  id: string;
  name: string;
  category: string;
  destinationId: string;
  destinationName: string | null;
  address: string | null;
  contactPhone: string | null;
  status: string;
};

export type MerchantStaff = {
  id: string;
  email: string | null;
  status: string;
};

export async function fetchDashboard(): Promise<MerchantDashboard> {
  const res = await apiFetch<{ data: MerchantDashboard }>('/merchant/dashboard', {
    accessToken: token(),
  });
  return res.data;
}

export async function lookupClaim(claimCode: string): Promise<ClaimLookup> {
  const res = await apiFetch<{ data: ClaimLookup }>(
    `/merchant/claims/lookup?claimCode=${encodeURIComponent(claimCode)}`,
    { accessToken: token() },
  );
  return res.data;
}

export async function redeemClaim(claimCode: string) {
  const res = await apiFetch<{
    data: { redemptionId: string; claimCode: string; voucherTitle: string; redeemedAt: string };
  }>('/merchant/redemptions', {
    method: 'POST',
    accessToken: token(),
    body: JSON.stringify({ claimCode }),
  });
  return res.data;
}

export async function fetchRedemptionsPage(
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
): Promise<PagedResult<RedemptionRow>> {
  return apiFetch(`/merchant/redemptions?page=${page}&limit=${limit}`, {
    accessToken: token(),
  });
}

export async function fetchRedemptions(): Promise<RedemptionRow[]> {
  const res = await fetchRedemptionsPage(1, 50);
  return res.data;
}

export async function fetchVouchers(): Promise<MerchantVoucher[]> {
  const res = await apiFetch<{ data: MerchantVoucher[] }>('/merchant/vouchers', {
    accessToken: token(),
  });
  return res.data;
}

export async function fetchVoucher(id: string): Promise<MerchantVoucher> {
  const res = await apiFetch<{ data: MerchantVoucher }>(`/merchant/vouchers/${id}`, {
    accessToken: token(),
  });
  return res.data;
}

export type CreateVoucherInput = {
  destinationId?: string;
  title: string;
  description?: string;
  discountLabel: string;
  minLevel: string;
  minBalance?: number;
  costPoints?: number;
  quotaTotal?: number;
  validFrom: string;
  validUntil: string;
};

export async function createVoucher(input: CreateVoucherInput) {
  const res = await apiFetch<{ data: MerchantVoucher }>('/merchant/vouchers', {
    method: 'POST',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function patchVoucher(
  id: string,
  input: { status?: string; title?: string; description?: string },
) {
  const res = await apiFetch<{ data: MerchantVoucher }>(`/merchant/vouchers/${id}`, {
    method: 'PATCH',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function fetchBusiness(): Promise<MerchantBusiness> {
  const res = await apiFetch<{ data: MerchantBusiness }>('/merchant/business', {
    accessToken: token(),
  });
  return res.data;
}

export async function patchBusiness(input: {
  name?: string;
  description?: string;
  address?: string;
  contactPhone?: string;
}) {
  const res = await apiFetch<{ data: MerchantBusiness }>('/merchant/business', {
    method: 'PATCH',
    accessToken: token(),
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function fetchStaff(): Promise<MerchantStaff[]> {
  const res = await apiFetch<{ data: MerchantStaff[] }>('/merchant/staff', {
    accessToken: token(),
  });
  return res.data;
}

export async function createStaff(email: string, password: string) {
  const res = await apiFetch<{ data: { id: string; email: string | null } }>('/merchant/staff', {
    method: 'POST',
    accessToken: token(),
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}
