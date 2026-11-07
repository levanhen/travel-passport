import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BadgeStatus,
  CheckinStatus,
  DestinationStatus,
  MerchantStatus,
  ParticipationLevel,
  Prisma,
  SiteStatus,
  UserRole,
} from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 4) return '****';
  return `${'*'.repeat(Math.min(phone.length - 4, 6))}${phone.slice(-4)}`;
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function daysAgoUtc(days: number): Date {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async pilotDestination() {
    const slug = process.env.PILOT_DESTINATION_SLUG ?? 'da-nang';
    const dest = await this.prisma.destination.findFirst({
      where: { slug, status: DestinationStatus.published },
    });
    if (!dest) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy destination pilot.', HttpStatus.NOT_FOUND);
    }
    return dest;
  }

  private checkinWhereForUser(
    user: JwtPayload,
    destinationId: string,
    since?: Date,
  ): Prisma.CheckinWhereInput {
    const base: Prisma.CheckinWhereInput = {
      destinationId,
      ...(since ? { checkedInAt: { gte: since } } : {}),
    };

    if (user.role === UserRole.site_operator) {
      if (!user.orgId) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }
      return {
        ...base,
        tourismSite: {
          participationLevel: ParticipationLevel.partner,
          organizationId: user.orgId,
        },
      };
    }

    if (user.role === UserRole.authority_admin || user.role === UserRole.platform_admin) {
      return base;
    }

    throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
  }

  async getDashboard(user: JwtPayload) {
    const destination = await this.pilotDestination();
    const todayStart = startOfTodayUtc();
    const weekStart = daysAgoUtc(7);

    if (user.role === UserRole.site_operator) {
      if (!user.orgId) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }

      const org = await this.prisma.organization.findUnique({ where: { id: user.orgId } });
      const sitesCount = await this.prisma.tourismSite.count({
        where: {
          destinationId: destination.id,
          deletedAt: null,
          participationLevel: ParticipationLevel.partner,
          organizationId: user.orgId,
        },
      });

      const [checkInsToday, checkIns7Days, recentCheckIns] = await Promise.all([
        this.prisma.checkin.count({
          where: this.checkinWhereForUser(user, destination.id, todayStart),
        }),
        this.prisma.checkin.count({
          where: this.checkinWhereForUser(user, destination.id, weekStart),
        }),
        this.prisma.checkin.findMany({
          where: this.checkinWhereForUser(user, destination.id),
          include: {
            tourismSite: { select: { name: true } },
            user: { select: { phone: true } },
          },
          orderBy: { checkedInAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        role: user.role,
        destinationName: destination.name,
        organizationName: org?.name ?? null,
        sites: { total: sitesCount, catalog: 0, partner: sitesCount, published: sitesCount },
        merchantsActive: 0,
        badgesPublished: 0,
        checkInsToday,
        checkIns7Days,
        recentCheckIns: recentCheckIns.map((c) => ({
          id: c.id,
          siteName: c.tourismSite.name,
          checkedInAt: c.checkedInAt.toISOString(),
          userPhoneMasked: maskPhone(c.user.phone),
          proofLevel: c.proofLevel,
          status: c.status,
        })),
      };
    }

    const siteBase = { destinationId: destination.id, deletedAt: null };
    const [
      sitesCatalog,
      sitesPartner,
      sitesPublished,
      merchantsActive,
      badgesPublished,
      checkInsToday,
      checkIns7Days,
      recentCheckIns,
    ] = await Promise.all([
      this.prisma.tourismSite.count({
        where: { ...siteBase, participationLevel: ParticipationLevel.catalog },
      }),
      this.prisma.tourismSite.count({
        where: { ...siteBase, participationLevel: ParticipationLevel.partner },
      }),
      this.prisma.tourismSite.count({
        where: { ...siteBase, status: SiteStatus.published },
      }),
      this.prisma.merchant.count({
        where: { destinationId: destination.id, status: MerchantStatus.active },
      }),
      this.prisma.badge.count({
        where: { destinationId: destination.id, status: BadgeStatus.published },
      }),
      this.prisma.checkin.count({
        where: this.checkinWhereForUser(user, destination.id, todayStart),
      }),
      this.prisma.checkin.count({
        where: this.checkinWhereForUser(user, destination.id, weekStart),
      }),
      this.prisma.checkin.findMany({
        where: this.checkinWhereForUser(user, destination.id),
        include: {
          tourismSite: { select: { name: true } },
          user: { select: { phone: true } },
        },
        orderBy: { checkedInAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      role: user.role,
      destinationName: destination.name,
      organizationName: null,
      sites: {
        total: sitesCatalog + sitesPartner,
        catalog: sitesCatalog,
        partner: sitesPartner,
        published: sitesPublished,
      },
      merchantsActive,
      badgesPublished,
      checkInsToday,
      checkIns7Days,
      recentCheckIns: recentCheckIns.map((c) => ({
        id: c.id,
        siteName: c.tourismSite.name,
        checkedInAt: c.checkedInAt.toISOString(),
        userPhoneMasked: maskPhone(c.user.phone),
        proofLevel: c.proofLevel,
        status: c.status,
      })),
    };
  }
}
