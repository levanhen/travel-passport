import { DEFAULT_PAGE_SIZE, PagedResult } from '@/app/_lib/pagination';
import { apiFetch, ApiRequestError } from './api';
import { getAccessToken } from './auth';

export type AvailableVoucher = {
  id: string;
  title: string;
  merchantName: string;
  minLevel: string;
  costPoints: number;
  discountLabel: string;
  validUntil: string;
  canClaim: boolean;
};

export type VoucherClaim = {
  id: string;
  claimCode: string;
  status: string;
  claimedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  voucherTitle: string;
  merchantName: string;
  discountLabel: string;
  qrPayload: string;
};

export async function fetchAvailableVouchers(destinationId?: string): Promise<AvailableVoucher[]> {
  const qs = destinationId ? `?destinationId=${encodeURIComponent(destinationId)}` : '';
  const res = await apiFetch<{ data: AvailableVoucher[] }>(`/vouchers/available${qs}`, {
    accessToken: getAccessToken(),
  });
  return res.data;
}

export async function claimVoucher(voucherId: string) {
  const res = await apiFetch<{
    data: {
      claim: VoucherClaim & { qrPayload: string };
      pointsDebited: number;
      newBalance: number;
    };
  }>(`/vouchers/${voucherId}/claim`, {
    method: 'POST',
    accessToken: getAccessToken(),
  });
  return res.data;
}

export async function fetchMyClaimsPage(
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
): Promise<PagedResult<VoucherClaim>> {
  return apiFetch(`/vouchers/claims?page=${page}&limit=${limit}`, {
    accessToken: getAccessToken(),
  });
}

export async function fetchMyClaims(): Promise<VoucherClaim[]> {
  const res = await fetchMyClaimsPage(1, 50);
  return res.data;
}

export { ApiRequestError };
