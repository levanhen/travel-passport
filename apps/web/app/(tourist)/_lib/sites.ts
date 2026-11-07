import { apiFetch } from './api';

export const PILOT_DESTINATION_SLUG =
  process.env.NEXT_PUBLIC_PILOT_DESTINATION_SLUG ?? 'da-nang';

export type Destination = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
};

export type Site = {
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

export const SITE_CATEGORY_LABELS: Record<string, string> = {
  HERITAGE: 'Di sản',
  BEACH: 'Biển',
  NATURE: 'Thiên nhiên',
  MOUNTAIN: 'Núi',
  ISLAND: 'Đảo',
  CULTURAL: 'Văn hóa',
  FOOD: 'Ẩm thực',
  OTHER: 'Khác',
};

export const SITE_CATEGORIES = Object.keys(SITE_CATEGORY_LABELS);

export function categoryLabel(category: string): string {
  return SITE_CATEGORY_LABELS[category] ?? category;
}

export async function fetchPilotDestination(): Promise<Destination> {
  const res = await apiFetch<{ data: Destination[] }>('/destinations');
  const dest = res.data.find((d) => d.slug === PILOT_DESTINATION_SLUG);
  if (!dest) {
    throw new Error(`Không tìm thấy destination pilot (${PILOT_DESTINATION_SLUG}).`);
  }
  return dest;
}

export async function fetchDestinationSites(
  destinationId: string,
  category?: string,
): Promise<Site[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await apiFetch<{ data: Site[] }>(`/destinations/${destinationId}/sites${qs}`);
  return res.data;
}

export async function fetchSite(id: string): Promise<Site> {
  const res = await apiFetch<{ data: Site }>(`/sites/${id}`);
  return res.data;
}
