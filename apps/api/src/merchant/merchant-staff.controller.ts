import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OrganizationStatus, UserRole, UserStatus } from '@tp/db';
import { hashSecret, normalizeEmail } from '../auth/auth.util';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { MerchantRoleGuard } from '../shared/guards/merchant-role.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { CreateMerchantStaffDto } from './dto/merchant.dto';
import { MerchantPortalService } from './merchant-portal.service';

@Controller('merchant/staff')
@UseGuards(JwtAuthGuard, MerchantRoleGuard)
export class MerchantStaffController {
  constructor(
    private readonly portal: MerchantPortalService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    this.portal.assertOwner(user);
    const merchant = await this.portal.getMerchantForUser(user);
    const memberships = await this.prisma.membership.findMany({
      where: {
        organizationId: merchant.organizationId,
        role: UserRole.merchant_staff,
      },
      include: { user: { select: { id: true, email: true, status: true } } },
    });
    return {
      data: memberships.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        status: m.user.status,
      })),
    };
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMerchantStaffDto) {
    this.portal.assertOwner(user);
    const merchant = await this.portal.getMerchantForUser(user);
    const email = normalizeEmail(dto.email);
    if (!email) {
      throw new ApiException('VALIDATION_ERROR', 'Email không hợp lệ.', 400);
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiException('VALIDATION_ERROR', 'Email đã được sử dụng.', 400);
    }

    const passwordHash = await hashSecret(dto.password);
    const staff = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: UserRole.merchant_staff,
          status: UserStatus.active,
        },
      });
      await tx.membership.create({
        data: {
          userId: u.id,
          organizationId: merchant.organizationId,
          role: UserRole.merchant_staff,
        },
      });
      return u;
    });

    return { data: { id: staff.id, email: staff.email } };
  }
}
