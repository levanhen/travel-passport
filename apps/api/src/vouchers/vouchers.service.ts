import { HttpStatus, Injectable } from '@nestjs/common';
import {
  MerchantStatus,
  TouristLevel,
  VoucherClaimStatus,
  VoucherStatus,
} from '@tp/db';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { meetsMinLevel } from '../points/level.util';
import { PointsService } from '../points/points.service';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { claimQrPayload, generateClaimCode } from './claim-code.util';

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  async listAvailable(userId: string, destinationId?: string) {
    const profile = await this.prisma.touristProfile.findUniqueOrThrow({ where: { userId } });
    const now = new Date();

    const vouchers = await this.prisma.voucher.findMany({
      where: {
        status: VoucherStatus.issued,
        deletedAt: null,
        validFrom: { lte: now },
        validUntil: { gte: now },
        ...(destinationId ? { destinationId } : {}),
        merchant: { status: MerchantStatus.active },
      },
      include: { merchant: true },
      orderBy: { title: 'asc' },
    });

    const claimed = await this.prisma.voucherClaim.findMany({
      where: { userId, voucherId: { in: vouchers.map((v) => v.id) } },
      select: { voucherId: true },
    });
    const claimedSet = new Set(claimed.map((c) => c.voucherId));

    return vouchers
      .filter((v) => {
        if (claimedSet.has(v.id)) return false;
        if (v.quotaTotal != null && v.quotaClaimed >= v.quotaTotal) return false;
        if (!meetsMinLevel(profile.level, v.minLevel)) return false;
        if (profile.pointsBalance < v.minBalance) return false;
        if (profile.pointsBalance < v.costPoints) return false;
        return true;
      })
      .map((v) => ({
        id: v.id,
        title: v.title,
        merchantName: v.merchant.name,
        minLevel: v.minLevel,
        costPoints: v.costPoints,
        discountLabel: v.discountLabel,
        validUntil: v.validUntil.toISOString(),
        canClaim: true,
      }));
  }

  async claim(user: JwtPayload, voucherId: string) {
    const profile = await this.prisma.touristProfile.findUniqueOrThrow({ where: { userId: user.sub } });
    const now = new Date();

    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, deletedAt: null },
      include: { merchant: true },
    });
    if (!voucher || voucher.status !== VoucherStatus.issued) {
      throw new ApiException('VOUCHER_NOT_FOUND', 'Không tìm thấy voucher.', 404);
    }
    if (voucher.validFrom > now || voucher.validUntil < now) {
      throw new ApiException('VOUCHER_NOT_AVAILABLE', 'Voucher không còn hiệu lực.', 400);
    }
    if (voucher.merchant.status !== MerchantStatus.active) {
      throw new ApiException('VOUCHER_NOT_AVAILABLE', 'Voucher không còn hiệu lực.', 400);
    }
    if (voucher.quotaTotal != null && voucher.quotaClaimed >= voucher.quotaTotal) {
      throw new ApiException('VOUCHER_NOT_AVAILABLE', 'Voucher đã hết suất.', 400);
    }
    if (!meetsMinLevel(profile.level, voucher.minLevel)) {
      throw new ApiException('VOUCHER_LEVEL_INSUFFICIENT', 'Level chưa đủ để claim.', 403);
    }
    if (profile.pointsBalance < voucher.minBalance) {
      throw new ApiException('VOUCHER_BALANCE_INSUFFICIENT', 'Số dư điểm chưa đủ.', 403);
    }
    if (profile.pointsBalance < voucher.costPoints) {
      throw new ApiException('POINTS_INSUFFICIENT', 'Không đủ điểm để claim.', 403);
    }

    const existing = await this.prisma.voucherClaim.findUnique({
      where: { voucherId_userId: { voucherId, userId: user.sub } },
    });
    if (existing) {
      throw new ApiException('VOUCHER_ALREADY_CLAIMED', 'Bạn đã claim voucher này.', 409);
    }

    const claimCode = generateClaimCode();
    const expiresAt = voucher.validUntil;

    const claim = await this.prisma.$transaction(async (tx) => {
      const row = await tx.voucherClaim.create({
        data: {
          voucherId,
          userId: user.sub,
          claimCode,
          status: VoucherClaimStatus.active,
          expiresAt,
        },
      });
      await tx.voucher.update({
        where: { id: voucherId },
        data: { quotaClaimed: { increment: 1 } },
      });
      return row;
    });

    let pointsDebited = 0;
    let newBalance = profile.pointsBalance;
    if (voucher.costPoints > 0) {
      const result = await this.points.debitForVoucherClaim(user.sub, voucher.costPoints, claim.id);
      pointsDebited = voucher.costPoints;
      newBalance = result.balance;
    }

    return {
      claim: {
        id: claim.id,
        voucherId: claim.voucherId,
        claimCode: claim.claimCode,
        status: claim.status,
        claimedAt: claim.claimedAt.toISOString(),
        expiresAt: claim.expiresAt.toISOString(),
        qrPayload: claimQrPayload(claim.claimCode),
      },
      pointsDebited,
      newBalance,
    };
  }

  async listClaims(userId: string, status?: VoucherClaimStatus, page = 1, limit = 20) {
    const where = { userId, ...(status ? { status } : {}) };
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.voucherClaim.findMany({
        where,
        include: { voucher: { include: { merchant: true } } },
        orderBy: { claimedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voucherClaim.count({ where }),
    ]);
    return {
      data: rows.map((c) => ({
        id: c.id,
        claimCode: c.claimCode,
        status: c.status,
        claimedAt: c.claimedAt.toISOString(),
        expiresAt: c.expiresAt.toISOString(),
        redeemedAt: c.redeemedAt?.toISOString() ?? null,
        voucherTitle: c.voucher.title,
        merchantName: c.voucher.merchant.name,
        discountLabel: c.voucher.discountLabel,
        qrPayload: claimQrPayload(c.claimCode),
      })),
      meta: { page, limit, total },
    };
  }
}
