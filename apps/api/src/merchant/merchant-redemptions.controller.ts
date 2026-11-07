import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { VoucherClaimStatus } from '@tp/db';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard';
import { MerchantRoleGuard } from '../shared/guards/merchant-role.guard';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { RedeemClaimDto } from './dto/merchant.dto';
import { MerchantPortalService } from './merchant-portal.service';

@Controller('merchant')
@UseGuards(JwtAuthGuard, MerchantRoleGuard)
export class MerchantRedemptionsController {
  constructor(
    private readonly portal: MerchantPortalService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('claims/lookup')
  async lookup(@CurrentUser() user: JwtPayload, @Query('claimCode') claimCode: string) {
    const merchant = await this.portal.getMerchantForUser(user);
    const claim = await this.loadClaim(claimCode, merchant.id);
    return {
      data: {
        claimCode: claim.claimCode,
        status: claim.status,
        voucherTitle: claim.voucher.title,
        discountLabel: claim.voucher.discountLabel,
        expiresAt: claim.expiresAt.toISOString(),
        canRedeem: claim.status === VoucherClaimStatus.active && claim.expiresAt >= new Date(),
      },
    };
  }

  @Post('redemptions')
  async redeem(@CurrentUser() user: JwtPayload, @Body() dto: RedeemClaimDto) {
    const merchant = await this.portal.getMerchantForUser(user);
    const claim = await this.loadClaim(dto.claimCode, merchant.id);

    if (claim.status === VoucherClaimStatus.redeemed) {
      throw new ApiException('CLAIM_ALREADY_REDEEMED', 'Voucher đã được redeem.', 409);
    }
    if (claim.expiresAt < new Date()) {
      throw new ApiException('CLAIM_EXPIRED', 'Claim đã hết hạn.', 400);
    }
    if (claim.status !== VoucherClaimStatus.active) {
      throw new ApiException('CLAIM_NOT_FOUND', 'Claim không hợp lệ.', 404);
    }

    const redemption = await this.prisma.$transaction(async (tx) => {
      await tx.voucherClaim.update({
        where: { id: claim.id },
        data: { status: VoucherClaimStatus.redeemed, redeemedAt: new Date() },
      });
      return tx.voucherRedemption.create({
        data: { voucherClaimId: claim.id, merchantStaffUserId: user.sub },
      });
    });

    return {
      data: {
        redemptionId: redemption.id,
        claimCode: claim.claimCode,
        voucherTitle: claim.voucher.title,
        redeemedAt: redemption.redeemedAt.toISOString(),
      },
    };
  }

  @Get('redemptions')
  async list(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    const merchant = await this.portal.getMerchantForUser(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = { voucherClaim: { voucher: { merchantId: merchant.id } } };

    const [rows, total] = await Promise.all([
      this.prisma.voucherRedemption.findMany({
        where,
        include: { voucherClaim: { include: { voucher: true } } },
        orderBy: { redeemedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voucherRedemption.count({ where }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        claimCode: r.voucherClaim.claimCode,
        voucherTitle: r.voucherClaim.voucher.title,
        redeemedAt: r.redeemedAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  @Get('dashboard')
  async dashboard(@CurrentUser() user: JwtPayload) {
    const merchant = await this.portal.getMerchantForUser(user);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalClaims, totalRedemptions, redemptionsToday, activeVouchers] = await Promise.all([
      this.prisma.voucherClaim.count({ where: { voucher: { merchantId: merchant.id } } }),
      this.prisma.voucherRedemption.count({
        where: { voucherClaim: { voucher: { merchantId: merchant.id } } },
      }),
      this.prisma.voucherRedemption.count({
        where: {
          voucherClaim: { voucher: { merchantId: merchant.id } },
          redeemedAt: { gte: todayStart },
        },
      }),
      this.prisma.voucher.count({
        where: { merchantId: merchant.id, status: 'issued', deletedAt: null },
      }),
    ]);

    return { data: { totalClaims, totalRedemptions, redemptionsToday, activeVouchers } };
  }

  private async loadClaim(claimCode: string, merchantId: string) {
    const claim = await this.prisma.voucherClaim.findUnique({
      where: { claimCode },
      include: { voucher: true },
    });
    if (!claim || claim.voucher.merchantId !== merchantId) {
      throw new ApiException('CLAIM_NOT_FOUND', 'Không tìm thấy mã claim.', 404);
    }
    return claim;
  }
}
