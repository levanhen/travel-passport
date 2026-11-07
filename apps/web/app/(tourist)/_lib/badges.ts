import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type BadgeItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconUrl?: string | null;
  earned: boolean;
  earnedAt: string | null;
  progress: { current: number; target: number };
  progressLabel: string;
};

export async function fetchBadges(destinationId?: string): Promise<BadgeItem[]> {
  const qs = destinationId ? `?destinationId=${encodeURIComponent(destinationId)}` : '';
  const res = await apiFetch<{ data: BadgeItem[] }>(`/badges${qs}`, {
    accessToken: getAccessToken(),
  });
  return res.data;
}

export async function fetchMyBadges(): Promise<BadgeItem[]> {
  const res = await apiFetch<{ data: { id: string; slug: string; name: string; description: string; earnedAt: string }[] }>(
    '/badges/mine?limit=50',
    { accessToken: getAccessToken() },
  );
  return res.data.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    earned: true,
    earnedAt: b.earnedAt,
    progress: { current: 1, target: 1 },
    progressLabel: 'Hoàn thành',
  }));
}
