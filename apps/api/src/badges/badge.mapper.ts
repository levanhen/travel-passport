import { Badge, BadgeCriteriaType, UserBadge } from '@tp/db';

export type BadgeProgress = {
  current: number;
  target: number;
};

export function progressLabelForBadge(
  badge: Badge,
  progress: BadgeProgress,
  earned: boolean,
): string {
  if (earned) return 'Hoàn thành';
  const criteria = badge.criteria as Record<string, unknown>;
  if (badge.criteriaType === BadgeCriteriaType.FIRST_CHECKIN) {
    return progress.current >= 1 ? 'Hoàn thành' : '0/1 chuyến đi';
  }
  const cat = criteria.siteCategory as string | undefined;
  if (cat === 'HERITAGE') return `${progress.current}/${progress.target} di sản`;
  if (cat === 'BEACH') return `${progress.current}/${progress.target} bãi biển`;
  return `${progress.current}/${progress.target} điểm`;
}

export function toBadgeListItem(
  badge: Badge,
  userBadge: UserBadge | null,
  progress: BadgeProgress,
) {
  const earned = Boolean(userBadge);
  return {
    id: badge.id,
    slug: badge.slug,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconObjectKey,
    earned,
    earnedAt: userBadge?.awardedAt.toISOString() ?? null,
    progress: earned ? { current: progress.target, target: progress.target } : progress,
    progressLabel: progressLabelForBadge(badge, progress, earned),
  };
}
