import { HttpStatus, Injectable } from '@nestjs/common';
import { CheckinStatus, UserRole } from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { PointsService } from '../points/points.service';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 4) return '****';
  return `${'*'.repeat(Math.min(phone.length - 4, 6))}${phone.slice(-4)}`;
}

@Injectable()
export class AdminCheckInsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  private assertSiteAccess(user: JwtPayload, site: { organizationId: string | null }) {
    if (user.role === UserRole.site_operator) {
      if (site.organizationId !== user.orgId) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }
    } else if (
      user.role !== UserRole.authority_admin &&
      user.role !== UserRole.platform_admin
    ) {
      throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
    }
  }

  private assertVoidAccess(user: JwtPayload) {
    if (user.role !== UserRole.authority_admin && user.role !== UserRole.platform_admin) {
      throw new ApiException('FORBIDDEN', 'Chỉ authority mới được void check-in.', 403);
    }
  }

  async listBySite(user: JwtPayload, siteId: string, page = 1, limit = 20) {
    const site = await this.prisma.tourismSite.findFirst({
      where: { id: siteId, deletedAt: null },
    });
    if (!site) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    this.assertSiteAccess(user, site);

    const where = { tourismSiteId: siteId };
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.checkin.findMany({
        where,
        include: { user: { select: { phone: true } } },
        orderBy: { checkedInAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkin.count({ where }),
    ]);

    return {
      data: rows.map((c) => ({
        id: c.id,
        checkedInAt: c.checkedInAt.toISOString(),
        userPhoneMasked: maskPhone(c.user.phone),
        proofLevel: c.proofLevel,
        evidenceFlags: c.evidenceFlags,
        pointsAwarded: c.pointsAwarded,
        status: c.status,
      })),
      meta: { page, limit, total },
    };
  }

  async getDetail(user: JwtPayload, checkinId: string) {
    const checkin = await this.prisma.checkin.findUnique({
      where: { id: checkinId },
      include: {
        tourismSite: true,
        user: { select: { id: true, phone: true } },
        voidedBy: { select: { email: true } },
      },
    });
    if (!checkin) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    this.assertSiteAccess(user, checkin.tourismSite);

    return {
      id: checkin.id,
      siteId: checkin.tourismSiteId,
      siteName: checkin.tourismSite.name,
      checkedInAt: checkin.checkedInAt.toISOString(),
      userPhoneMasked: maskPhone(checkin.user.phone),
      userId: checkin.userId,
      proofLevel: checkin.proofLevel,
      evidenceFlags: checkin.evidenceFlags,
      pointsAwarded: checkin.pointsAwarded,
      status: checkin.status,
      voidReason: checkin.voidReason,
      voidedAt: checkin.voidedAt?.toISOString() ?? null,
      voidedByEmail: checkin.voidedBy?.email ?? null,
      participationLevel: checkin.participationLevel,
    };
  }

  async voidCheckin(user: JwtPayload, checkinId: string, voidReason: string) {
    this.assertVoidAccess(user);

    const checkin = await this.prisma.checkin.findUnique({
      where: { id: checkinId },
      include: { tourismSite: true },
    });
    if (!checkin) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    if (checkin.status === CheckinStatus.void) {
      throw new ApiException('CHECKIN_ALREADY_VOID', 'Check-in đã bị void.', 409);
    }

    await this.points.reverseCheckinPoints(checkin.userId, checkinId);

    const updated = await this.prisma.checkin.update({
      where: { id: checkinId },
      data: {
        status: CheckinStatus.void,
        voidReason,
        voidedAt: new Date(),
        voidedByUserId: user.sub,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      voidReason: updated.voidReason,
      voidedAt: updated.voidedAt!.toISOString(),
    };
  }
}
