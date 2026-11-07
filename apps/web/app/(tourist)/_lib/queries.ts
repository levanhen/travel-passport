import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, TouristUser } from '@/app/(tourist)/_lib/auth';
import { BadgeItem, fetchBadges } from '@/app/(tourist)/_lib/badges';
import { fetchPointsSummary, PointsSummary } from '@/app/(tourist)/_lib/points';
import {
  Destination,
  fetchDestinationSites,
  fetchPilotDestination,
  Site,
} from '@/app/(tourist)/_lib/sites';
import { AvailableVoucher, fetchAvailableVouchers } from '@/app/(tourist)/_lib/vouchers';

export const touristKeys = {
  me: ['tourist', 'me'] as const,
  pointsSummary: ['tourist', 'points', 'summary'] as const,
  destination: ['tourist', 'destination'] as const,
  sites: (destinationId: string) => ['tourist', 'sites', destinationId] as const,
  badges: (destinationId: string) => ['tourist', 'badges', destinationId] as const,
  vouchers: (destinationId: string) => ['tourist', 'vouchers', destinationId] as const,
};

const STALE = {
  me: 5 * 60_000,
  points: 30_000,
  destination: 30 * 60_000,
  sites: 10 * 60_000,
  badges: 5 * 60_000,
  vouchers: 2 * 60_000,
};

export function useTouristMe(enabled = true) {
  return useQuery({
    queryKey: touristKeys.me,
    queryFn: fetchMe,
    enabled,
    staleTime: STALE.me,
  });
}

export function usePointsSummary(enabled = true) {
  return useQuery({
    queryKey: touristKeys.pointsSummary,
    queryFn: fetchPointsSummary,
    staleTime: STALE.points,
    enabled,
  });
}

export function usePilotDestination() {
  return useQuery({
    queryKey: touristKeys.destination,
    queryFn: fetchPilotDestination,
    staleTime: STALE.destination,
  });
}

export function useDestinationSites(destinationId: string | undefined) {
  return useQuery({
    queryKey: touristKeys.sites(destinationId ?? ''),
    queryFn: () => fetchDestinationSites(destinationId!),
    enabled: !!destinationId,
    staleTime: STALE.sites,
  });
}

export function useBadges(destinationId: string | undefined) {
  return useQuery({
    queryKey: touristKeys.badges(destinationId ?? ''),
    queryFn: () => fetchBadges(destinationId!),
    enabled: !!destinationId,
    staleTime: STALE.badges,
  });
}

export function useAvailableVouchers(destinationId: string | undefined) {
  return useQuery({
    queryKey: touristKeys.vouchers(destinationId ?? ''),
    queryFn: () => fetchAvailableVouchers(destinationId!),
    enabled: !!destinationId,
    staleTime: STALE.vouchers,
  });
}

/** Sau check-in / claim voucher — làm mới dữ liệu liên quan */
export function useInvalidateTouristData() {
  const client = useQueryClient();
  return {
    afterCheckin: () => {
      client.invalidateQueries({ queryKey: touristKeys.pointsSummary });
      client.invalidateQueries({ queryKey: ['tourist', 'badges'] });
    },
    afterVoucherClaim: () => {
      client.invalidateQueries({ queryKey: touristKeys.pointsSummary });
      client.invalidateQueries({ queryKey: ['tourist', 'vouchers'] });
    },
    setPointsSummary: (summary: PointsSummary) => {
      client.setQueryData(touristKeys.pointsSummary, summary);
    },
    setMe: (user: TouristUser | null) => {
      client.setQueryData(touristKeys.me, user);
    },
  };
}

export type { BadgeItem, Destination, Site, PointsSummary, AvailableVoucher };
