import { Injectable } from '@nestjs/common';
import {
  Badge,
  BadgeCriteriaType,
  BadgeStatus,
  CheckinStatus,
  ProofLevel,
  SiteCategory,
} from '@tp/db';
import { PrismaService } from '../shared/prisma.service';
import { meetsMinProofLevel } from '../check-in/utils/proof.util';
import { ApiException } from '../shared/api.exception';
import { BadgeProgress, toBadgeListItem } from './badge.mapper';

export type BadgeUnlock = {
  id: string;
  slug: string;
  name: string;
};

type CheckinCountCriteria = {
  destinationId?: string | null;
  siteCategory?: SiteCategory | null;
  minProofLevel?: ProofLevel;
  requirePhoto?: boolean;
  distinctSites?: boolean;
  count: number;
};

type FirstCheckinCriteria = {
  destinationId?: string | null;
};

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTourist(userId: string, destinationId?: string) {
    const badges = await this.prisma.badge.findMany({
      where: {
        status: BadgeStatus.published,
        ...(destinationId
          ? { OR: [{ destinationId: null }, { destinationId }] }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId, badgeId: { in: badges.map((b) => b.id) } },
    });
    const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub]));

    const data = await Promise.all(
      badges.map(async (badge) => {
        const ub = earnedMap.get(badge.id) ?? null;
        const progress = await this.computeProgress(userId, badge);
        return toBadgeListItem(badge, ub, progress);
      }),
    );
    return data;
  }

  async getForTourist(userId: string, badgeId: string) {
    const badge = await this.prisma.badge.findFirst({
      where: { id: badgeId, status: BadgeStatus.published },
    });
    if (!badge) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', 404);
    }
    const ub = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    const progress = await this.computeProgress(userId, badge);
    return toBadgeListItem(badge, ub, progress);
  }

  async listMine(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { awardedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userBadge.count({ where: { userId } }),
    ]);
    return {
      data: rows.map((ub) => ({
        id: ub.badge.id,
        slug: ub.badge.slug,
        name: ub.badge.name,
        description: ub.badge.description,
        earnedAt: ub.awardedAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async computeProgress(userId: string, badge: Badge): Promise<BadgeProgress> {
    if (badge.criteriaType === BadgeCriteriaType.FIRST_CHECKIN) {
      const criteria = badge.criteria as FirstCheckinCriteria;
      const current = await this.prisma.checkin.count({
        where: {
          userId,
          status: CheckinStatus.confirmed,
          ...(criteria.destinationId ? { destinationId: criteria.destinationId } : {}),
        },
      });
      return { current: Math.min(current, 1), target: 1 };
    }

    const criteria = badge.criteria as CheckinCountCriteria;
    const target = criteria.count ?? 1;
    const current = await this.countQualifyingCheckins(userId, criteria);
    return { current: Math.min(current, target), target };
  }

  private async countQualifyingCheckins(userId: string, criteria: CheckinCountCriteria): Promise<number> {
    const checkins = await this.prisma.checkin.findMany({
      where: {
        userId,
        status: CheckinStatus.confirmed,
        ...(criteria.destinationId ? { destinationId: criteria.destinationId } : {}),
        ...(criteria.siteCategory
          ? { tourismSite: { category: criteria.siteCategory } }
          : {}),
      },
    });
    const minLevel = criteria.minProofLevel ?? ProofLevel.L0;
    const requirePhoto = criteria.requirePhoto ?? false;
    const qualifying = checkins.filter((c) => {
      if (!meetsMinProofLevel(c.proofLevel, minLevel)) return false;
      if (requirePhoto && !c.evidenceFlags.includes('photo')) return false;
      return true;
    });
    return criteria.distinctSites !== false
      ? new Set(qualifying.map((c) => c.tourismSiteId)).size
      : qualifying.length;
  }

  async evaluateForUser(
    userId: string,
    triggerCheckinId: string,
    destinationId: string,
  ): Promise<BadgeUnlock[]> {
    const badges = await this.prisma.badge.findMany({
      where: {
        status: BadgeStatus.published,
        OR: [{ destinationId: null }, { destinationId }],
      },
    });

    const unlocked: BadgeUnlock[] = [];

    for (const badge of badges) {
      const existing = await this.prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });
      if (existing) continue;

      let earned = false;
      if (badge.criteriaType === BadgeCriteriaType.FIRST_CHECKIN) {
        earned = await this.meetsFirstCheckin(userId, badge.criteria as FirstCheckinCriteria);
      } else if (badge.criteriaType === BadgeCriteriaType.CHECKIN_COUNT) {
        earned = await this.meetsCheckinCount(userId, badge.criteria as CheckinCountCriteria);
      }

      if (!earned) continue;

      try {
        await this.prisma.userBadge.create({
          data: { userId, badgeId: badge.id, triggerCheckinId },
        });
        unlocked.push({ id: badge.id, slug: badge.slug, name: badge.name });
      } catch {
        // race: unique (userId, badgeId)
      }
    }

    return unlocked;
  }

  private async meetsFirstCheckin(userId: string, criteria: FirstCheckinCriteria): Promise<boolean> {
    const count = await this.prisma.checkin.count({
      where: {
        userId,
        status: CheckinStatus.confirmed,
        ...(criteria.destinationId ? { destinationId: criteria.destinationId } : {}),
      },
    });
    return count >= 1;
  }

  private async meetsCheckinCount(userId: string, criteria: CheckinCountCriteria): Promise<boolean> {
    const current = await this.countQualifyingCheckins(userId, criteria);
    return current >= (criteria.count ?? 1);
  }
}
