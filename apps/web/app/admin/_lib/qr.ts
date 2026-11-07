import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type QrTokenResponse = {
  siteId: string;
  siteName: string;
  token: string;
  expiresAt: string;
};

export async function fetchQrToken(siteId: string): Promise<QrTokenResponse> {
  const res = await apiFetch<{ data: QrTokenResponse }>(`/admin/sites/${siteId}/qr-token`, {
    accessToken: getAccessToken(),
  });
  return res.data;
}
