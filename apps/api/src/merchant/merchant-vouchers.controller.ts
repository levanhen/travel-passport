import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { VoucherStatus } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { MerchantRoleGuard } from '../shared/guards/merchant-role.guard';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { CreateMerchantVoucherDto, PatchMerchantVoucherDto } from './dto/merchant.dto';
import { MerchantPortalService } from './merchant-portal.service';

@Controller('merchant/vouchers')
@UseGuards(JwtAuthGuard, MerchantRoleGuard)
export class MerchantVouchersController {
  constructor(
    private readonly portal: MerchantPortalService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMerchantVoucherDto) {
    this.portal.assertOwner(user);
    const merchant = await this.portal.getMerchantForUser(user);
    const voucher = await this.prisma.voucher.create({
      data: {
        merchantId: merchant.id,
        destinationId: dto.destinationId ?? merchant.destinationId,
        title: dto.title,
        description: dto.description,
        discountLabel: dto.discountLabel,
        minLevel: dto.minLevel,
        minBalance: dto.minBalance ?? 0,
        costPoints: dto.costPoints ?? 0,
        quotaTotal: dto.quotaTotal,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        status: VoucherStatus.draft,
      },
    });
    return { data: voucher };
  }

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: VoucherStatus,
  ) {
    const merchant = await this.portal.getMerchantForUser(user);
    const data = await this.prisma.voucher.findMany({
      where: { merchantId: merchant.id, deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  @Get(':id')
  async getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const merchant = await this.portal.getMerchantForUser(user);
    const voucher = await this.prisma.voucher.findFirst({
      where: { id, merchantId: merchant.id, deletedAt: null },
    });
    if (!voucher) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', 404);
    }
    const redemptionsCount = await this.prisma.voucherRedemption.count({
      where: { voucherClaim: { voucherId: voucher.id } },
    });
    return { data: { ...voucher, redemptionsCount } };
  }

  @Patch(':id')
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PatchMerchantVoucherDto,
  ) {
    this.portal.assertOwner(user);
    const merchant = await this.portal.getMerchantForUser(user);
    const voucher = await this.prisma.voucher.findFirst({
      where: { id, merchantId: merchant.id },
    });
    if (!voucher) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', 404);
    }
    if (dto.status === VoucherStatus.cancelled || dto.status === VoucherStatus.issued) {
      // ok
    }
    const updated = await this.prisma.voucher.update({
      where: { id },
      data: { status: dto.status, title: dto.title, description: dto.description },
    });
    return { data: updated };
  }
}
