import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ParticipationLevel,
  QrMode,
  SiteStatus,
  UserRole,
} from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { CheckInQrService } from '../check-in/check-in-qr.service';

@Injectable()
export class AdminQrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qr: CheckInQrService,
  ) {}

  async issueToken(user: JwtPayload, siteId: string) {
    const site = await this.prisma.tourismSite.findFirst({
      where: { id: siteId, deletedAt: null },
    });
    if (!site) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    if (site.participationLevel !== ParticipationLevel.partner) {
      throw new ApiException('VALIDATION_ERROR', 'Chỉ site partner mới có QR quầy.', 400);
    }
    if (site.qrMode !== QrMode.rotating) {
      throw new ApiException('VALIDATION_ERROR', 'Site không dùng QR xoay.', 400);
    }
    if (site.status !== SiteStatus.published) {
      throw new ApiException('SITE_CHECKIN_DISABLED', 'Site chưa published.', 403);
    }

    if (user.role === UserRole.site_operator) {
      if (user.orgId !== site.organizationId) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }
    } else if (
      user.role !== UserRole.authority_admin &&
      user.role !== UserRole.platform_admin
    ) {
      throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
    }

    const token = await this.qr.issueRotatingToken(site.id);
    return { siteId: site.id, siteName: site.name, ...token };
  }
}
