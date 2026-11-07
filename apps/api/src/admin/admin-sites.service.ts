import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ParticipationLevel,
  Prisma,
  ProofLevel,
  SiteStatus,
  UserRole,
} from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { CreateAdminSiteDto, PatchAdminSiteDto } from './dto/admin-site.dto';
import { DestinationsService } from '../destinations/destinations.service';
import { SiteReadModel, toSiteReadModel } from '../destinations/site.mapper';

@Injectable()
export class AdminSitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly destinations: DestinationsService,
  ) {}

  private assertCanCreate(user: JwtPayload, dto: CreateAdminSiteDto) {
    if (dto.participationLevel === ParticipationLevel.catalog) {
      if (user.role !== UserRole.authority_admin && user.role !== UserRole.platform_admin) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }
      if (dto.organizationId) {
        throw new ApiException(
          'SITE_CATALOG_NEEDS_NO_ORG',
          'Site catalog không được gắn tổ chức.',
          400,
        );
      }
      if (dto.qrMode) {
        throw new ApiException('VALIDATION_ERROR', 'Site catalog không có qrMode.', 400);
      }
      return;
    }

    if (!dto.organizationId || !dto.qrMode) {
      throw new ApiException(
        'SITE_PARTNER_NEEDS_ORG',
        'Site partner cần organizationId và qrMode.',
        400,
      );
    }

    if (user.role === UserRole.site_operator) {
      if (user.orgId !== dto.organizationId) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }
    } else if (
      user.role !== UserRole.authority_admin &&
      user.role !== UserRole.platform_admin
    ) {
      throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
    }
  }

  private assertCanPublish(user: JwtPayload, status?: SiteStatus) {
    if (status === SiteStatus.published) {
      if (user.role !== UserRole.authority_admin && user.role !== UserRole.platform_admin) {
        throw new ApiException('FORBIDDEN', 'Chỉ authority/platform được publish site.', 403);
      }
    }
  }

  async create(user: JwtPayload, dto: CreateAdminSiteDto): Promise<SiteReadModel> {
    this.assertCanCreate(user, dto);
    this.assertCanPublish(user, dto.status);

    const destination = await this.prisma.destination.findUnique({
      where: { id: dto.destinationId },
    });
    if (!destination) {
      throw new ApiException('NOT_FOUND', 'Destination không tồn tại.', HttpStatus.NOT_FOUND);
    }

    if (dto.participationLevel === ParticipationLevel.partner) {
      await this.destinations.assertAuthorityOrg(dto.organizationId!);
    }

    const geofence =
      dto.geofenceRadiusMeters ??
      (dto.participationLevel === ParticipationLevel.catalog ? 80 : 100);

    const status =
      dto.status ??
      (user.role === UserRole.site_operator ? SiteStatus.draft : SiteStatus.draft);

    try {
      const site = await this.prisma.tourismSite.create({
        data: {
          destinationId: dto.destinationId,
          participationLevel: dto.participationLevel,
          organizationId:
            dto.participationLevel === ParticipationLevel.partner ? dto.organizationId : null,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          address: dto.address,
          latitude: new Prisma.Decimal(dto.latitude),
          longitude: new Prisma.Decimal(dto.longitude),
          geofenceRadiusMeters: geofence,
          category: dto.category,
          status,
          checkInEnabled: true,
          qrMode: dto.participationLevel === ParticipationLevel.partner ? dto.qrMode! : null,
          staticQrEnabled: dto.staticQrEnabled ?? false,
        },
        include: { organization: true },
      });
      return toSiteReadModel(site);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ApiException('VALIDATION_ERROR', 'Slug đã tồn tại trong destination.', 409);
      }
      throw e;
    }
  }

  async patch(user: JwtPayload, id: string, dto: PatchAdminSiteDto): Promise<SiteReadModel> {
    const site = await this.prisma.tourismSite.findFirst({
      where: { id, deletedAt: null },
      include: { organization: true },
    });
    if (!site) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }

    if (user.role === UserRole.site_operator) {
      if (site.organizationId !== user.orgId || site.participationLevel !== ParticipationLevel.partner) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }
      if (dto.status === SiteStatus.published || dto.participationLevel) {
        throw new ApiException('FORBIDDEN', 'Operator không được publish hoặc đổi level.', 403);
      }
    } else if (
      user.role !== UserRole.authority_admin &&
      user.role !== UserRole.platform_admin
    ) {
      throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
    }

    this.assertCanPublish(user, dto.status);

    const nextLevel = dto.participationLevel ?? site.participationLevel;
    const upgrading =
      site.participationLevel === ParticipationLevel.catalog &&
      nextLevel === ParticipationLevel.partner;

    if (
      site.participationLevel === ParticipationLevel.partner &&
      nextLevel === ParticipationLevel.catalog
    ) {
      const partnerCheckins = await this.prisma.checkin.count({
        where: {
          tourismSiteId: site.id,
          proofLevel: { in: [ProofLevel.L1, ProofLevel.L2] },
        },
      });
      if (partnerCheckins > 0) {
        throw new ApiException(
          'SITE_DOWNGRADE_FORBIDDEN',
          'Không thể hạ cấp site đã có check-in partner.',
          409,
        );
      }
    }

    let organizationId = dto.organizationId ?? site.organizationId;
    let qrMode = dto.qrMode ?? site.qrMode;

    if (nextLevel === ParticipationLevel.catalog) {
      organizationId = null;
      qrMode = null;
    } else {
      if (!organizationId) {
        throw new ApiException('SITE_PARTNER_NEEDS_ORG', 'Site partner cần organizationId.', 400);
      }
      if (!qrMode) {
        throw new ApiException('VALIDATION_ERROR', 'Site partner cần qrMode.', 400);
      }
      await this.destinations.assertAuthorityOrg(organizationId);
    }

    if (upgrading && dto.organizationId) {
      await this.destinations.assertAuthorityOrg(dto.organizationId);
    }

    try {
      const updated = await this.prisma.tourismSite.update({
        where: { id },
        data: {
          participationLevel: nextLevel,
          organizationId,
          qrMode,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          address: dto.address,
          latitude: dto.latitude !== undefined ? new Prisma.Decimal(dto.latitude) : undefined,
          longitude: dto.longitude !== undefined ? new Prisma.Decimal(dto.longitude) : undefined,
          geofenceRadiusMeters: dto.geofenceRadiusMeters,
          category: dto.category,
          staticQrEnabled: dto.staticQrEnabled,
          checkInEnabled: dto.checkInEnabled,
          status: dto.status,
        },
        include: { organization: true },
      });
      return toSiteReadModel(updated);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ApiException('VALIDATION_ERROR', 'Slug đã tồn tại trong destination.', 409);
      }
      throw e;
    }
  }
}
