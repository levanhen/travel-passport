import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DestinationStatus,
  OrganizationStatus,
  OrganizationType,
  ParticipationLevel,
  Prisma,
  SiteStatus,
  UserRole,
} from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { ListSitesQueryDto } from './dto/list-sites-query.dto';
import {
  DestinationReadModel,
  SiteReadModel,
  toDestinationReadModel,
  toSiteReadModel,
} from './site.mapper';

const STAFF_ROLES: UserRole[] = [
  UserRole.site_operator,
  UserRole.authority_admin,
  UserRole.platform_admin,
];

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  private isStaff(role: string): boolean {
    return STAFF_ROLES.includes(role as UserRole);
  }

  private isAuthority(role: string): boolean {
    return role === UserRole.authority_admin || role === UserRole.platform_admin;
  }

  async listDestinations(): Promise<DestinationReadModel[]> {
    const rows = await this.prisma.destination.findMany({
      where: { status: DestinationStatus.published },
      orderBy: { name: 'asc' },
    });
    return rows.map(toDestinationReadModel);
  }

  async getDestination(id: string): Promise<DestinationReadModel> {
    const dest = await this.prisma.destination.findFirst({
      where: { id, status: DestinationStatus.published },
    });
    if (!dest) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    return toDestinationReadModel(dest);
  }

  private touristSiteWhere(destinationId: string): Prisma.TourismSiteWhereInput {
    return {
      destinationId,
      deletedAt: null,
      status: SiteStatus.published,
      checkInEnabled: true,
      destination: { status: DestinationStatus.published },
      OR: [
        { participationLevel: ParticipationLevel.catalog },
        {
          participationLevel: ParticipationLevel.partner,
          organization: { status: OrganizationStatus.active },
        },
      ],
    };
  }

  private staffSiteWhere(
    destinationId: string,
    user: JwtPayload,
  ): Prisma.TourismSiteWhereInput {
    if (this.isAuthority(user.role)) {
      return { destinationId, deletedAt: null };
    }
    if (user.role === UserRole.site_operator) {
      if (!user.orgId) {
        throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
      }
      return {
        destinationId,
        deletedAt: null,
        participationLevel: ParticipationLevel.partner,
        organizationId: user.orgId,
      };
    }
    throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
  }

  async listSites(
    destinationId: string,
    query: ListSitesQueryDto,
    user?: JwtPayload,
  ): Promise<SiteReadModel[]> {
    const dest = await this.prisma.destination.findUnique({ where: { id: destinationId } });
    if (!dest) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }

    const where: Prisma.TourismSiteWhereInput = user?.role && this.isStaff(user.role)
      ? this.staffSiteWhere(destinationId, user)
      : this.touristSiteWhere(destinationId);

    if (query.participationLevel) where.participationLevel = query.participationLevel;
    if (query.category) where.category = query.category;

    const rows = await this.prisma.tourismSite.findMany({
      where,
      include: { organization: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(toSiteReadModel);
  }

  async getSite(id: string, user?: JwtPayload): Promise<SiteReadModel> {
    const site = await this.prisma.tourismSite.findFirst({
      where: { id, deletedAt: null },
      include: { organization: true, destination: true },
    });
    if (!site) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }

    if (user?.role && this.isStaff(user.role)) {
      if (user.role === UserRole.site_operator) {
        if (
          site.participationLevel !== ParticipationLevel.partner ||
          site.organizationId !== user.orgId
        ) {
          throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
        }
      }
      return toSiteReadModel(site);
    }

    if (
      site.status !== SiteStatus.published ||
      !site.checkInEnabled ||
      site.destination.status !== DestinationStatus.published
    ) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    if (
      site.participationLevel === ParticipationLevel.partner &&
      site.organization?.status !== OrganizationStatus.active
    ) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }

    return toSiteReadModel(site);
  }

  async assertAuthorityOrg(orgId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org || org.type !== OrganizationType.DESTINATION_OPERATOR) {
      throw new ApiException('ORG_TYPE_INVALID', 'Tổ chức không phải đơn vị vận hành điểm.', 400);
    }
    if (org.status !== OrganizationStatus.active) {
      throw new ApiException('VALIDATION_ERROR', 'Tổ chức chưa active.', 400);
    }
    return org;
  }
}
