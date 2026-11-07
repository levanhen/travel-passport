import { DEFAULT_PAGE_SIZE, PagedResult } from '@/app/_lib/pagination';
import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type PointsSummary = {
  balance: number;
  level: string;
  levelLabel: string;
  lifetimePoints: number;
  pointsToNextLevel: number;
  nextLevel: string | null;
};

export type PointTransaction = {
  id: string;
  amount: number;
  type: string;
  proofLevel: string | null;
  description: string | null;
  createdAt: string;
};

export async function fetchPointsSummary(): Promise<PointsSummary> {
  const res = await apiFetch<{ data: PointsSummary }>('/points/summary', {
    accessToken: getAccessToken(),
  });
  return res.data;
}

export async function fetchPointTransactions(
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
): Promise<PagedResult<PointTransaction>> {
  return apiFetch(`/points/transactions?page=${page}&limit=${limit}`, {
    accessToken: getAccessToken(),
  });
}
