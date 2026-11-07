import { HttpStatus, Injectable } from '@nestjs/common';
import { Badge, BadgeStatus, Prisma, UserRole } from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { CreateAdminBadgeDto, PatchAdminBadgeDto } from './dto/admin-badge.dto';

@Injectable()
export class AdminBadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: JwtPayload, dto: CreateAdminBadgeDto): Promise<{ id: string; slug: string }> {
    this.assertAdmin(user);
    const existing = await this.prisma.badge.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ApiException('BADGE_SLUG_TAKEN', 'Slug badge đã tồn tại.', 409);
    }
    const badge = await this.prisma.badge.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        destinationId: dto.destinationId,
        criteriaType: dto.criteriaType,
        criteria: dto.criteria as Prisma.InputJsonValue,
        sortOrder: dto.sortOrder ?? 0,
        status: BadgeStatus.draft,
      },
    });
    return badge;
  }

  async patch(user: JwtPayload, id: string, dto: PatchAdminBadgeDto): Promise<{ id: string }> {
    this.assertAdmin(user);
    const badge = await this.prisma.badge.findUnique({ where: { id } });
    if (!badge) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }

    if (dto.criteria) {
      const earned = await this.prisma.userBadge.count({ where: { badgeId: id } });
      if (earned > 0) {
        throw new ApiException('BADGE_CRITERIA_LOCKED', 'Không đổi criteria khi đã có người đạt.', 409);
      }
    }

    return this.prisma.badge.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        sortOrder: dto.sortOrder,
        ...(dto.criteria !== undefined
          ? { criteria: dto.criteria as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async list(user: JwtPayload): Promise<Badge[]> {
    this.assertAdmin(user);
    return this.prisma.badge.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  async getOne(user: JwtPayload, id: string): Promise<Badge> {
    this.assertAdmin(user);
    const badge = await this.prisma.badge.findUnique({ where: { id } });
    if (!badge) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    return badge;
  }

  private assertAdmin(user: JwtPayload) {
    if (user.role !== UserRole.authority_admin && user.role !== UserRole.platform_admin) {
      throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
    }
  }
}
