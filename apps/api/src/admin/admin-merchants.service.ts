import { HttpStatus, Injectable } from '@nestjs/common';
import {
  MerchantStatus,
  OrganizationStatus,
  OrganizationType,
  UserRole,
  UserStatus,
} from '@tp/db';
import { hashSecret, normalizeEmail } from '../auth/auth.util';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { CreateAdminMerchantDto, PatchAdminMerchantDto } from './dto/admin-merchant.dto';

function orgSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

@Injectable()
export class AdminMerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: JwtPayload, dto: CreateAdminMerchantDto) {
    this.assertAdmin(user);
    const email = normalizeEmail(dto.owner.email);
    if (!email) {
      throw new ApiException('VALIDATION_ERROR', 'Email không hợp lệ.', 400);
    }

    const dest = await this.prisma.destination.findUnique({ where: { id: dto.destinationId } });
    if (!dest) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy destination.', HttpStatus.NOT_FOUND);
    }

    const dupMerchant = await this.prisma.merchant.findUnique({
      where: {
        destinationId_slug: { destinationId: dto.destinationId, slug: dto.merchant.slug },
      },
    });
    if (dupMerchant) {
      throw new ApiException('VALIDATION_ERROR', 'Merchant slug đã tồn tại.', 400);
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiException('VALIDATION_ERROR', 'Email đã được sử dụng.', 400);
    }

    const orgSlug = orgSlugFromName(dto.organizationName);
    const passwordHash = await hashSecret(dto.owner.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: orgSlug,
          type: OrganizationType.MERCHANT,
          status: OrganizationStatus.active,
        },
      });

      const owner = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: UserRole.merchant_owner,
          status: UserStatus.active,
        },
      });

      await tx.membership.create({
        data: { userId: owner.id, organizationId: org.id, role: UserRole.merchant_owner },
      });

      const merchant = await tx.merchant.create({
        data: {
          organizationId: org.id,
          destinationId: dto.destinationId,
          name: dto.merchant.name,
          slug: dto.merchant.slug,
          category: dto.merchant.category,
          address: dto.merchant.address,
          status: MerchantStatus.draft,
        },
      });

      return { organizationId: org.id, merchantId: merchant.id, ownerUserId: owner.id };
    });

    return result;
  }

  async list(user: JwtPayload, destinationId?: string, status?: MerchantStatus) {
    this.assertAdmin(user);
    return this.prisma.merchant.findMany({
      where: {
        ...(destinationId ? { destinationId } : {}),
        ...(status ? { status } : {}),
      },
      include: { destination: { select: { name: true } }, organization: true },
      orderBy: { name: 'asc' },
    });
  }

  async patch(user: JwtPayload, id: string, dto: PatchAdminMerchantDto) {
    this.assertAdmin(user);
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const m = await tx.merchant.update({
        where: { id },
        data: { status: dto.status },
      });
      if (dto.status === MerchantStatus.suspended) {
        await tx.organization.update({
          where: { id: merchant.organizationId },
          data: { status: OrganizationStatus.disabled },
        });
      } else if (dto.status === MerchantStatus.active) {
        await tx.organization.update({
          where: { id: merchant.organizationId },
          data: { status: OrganizationStatus.active },
        });
      }
      return m;
    });

    return updated;
  }

  private assertAdmin(user: JwtPayload) {
    if (user.role !== UserRole.authority_admin && user.role !== UserRole.platform_admin) {
      throw new ApiException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
    }
  }
}
