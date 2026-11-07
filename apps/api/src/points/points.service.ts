import { Injectable } from '@nestjs/common';
import { EvidenceType, PointTxnType, Prisma, ProofLevel, TouristLevel } from '@tp/db';
import { PrismaService } from '../shared/prisma.service';
import { levelFromBalance } from '../check-in/utils/points.util';
import { levelLabel, pointsToNextLevel } from './level.util';
import { ApiException } from '../shared/api.exception';

export type PointsAwardResult = {
  delta: number;
  balance: number;
  level: TouristLevel;
};

export type PointsSummary = {
  balance: number;
  level: TouristLevel;
  levelLabel: string;
  lifetimePoints: number;
  pointsToNextLevel: number;
  nextLevel: TouristLevel | null;
};

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async awardCheckinCreate(
    userId: string,
    checkinId: string,
    amount: number,
    proofLevel: ProofLevel,
  ): Promise<PointsAwardResult> {
    if (amount <= 0) {
      return this.getBalance(userId);
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.pointTransaction.findFirst({
        where: { awardCheckinId: checkinId, type: PointTxnType.CHECKIN_AWARD },
      });
      if (existing) {
        return this.getBalanceInTx(tx, userId);
      }

      await tx.pointTransaction.create({
        data: {
          userId,
          amount,
          type: PointTxnType.CHECKIN_AWARD,
          checkinId,
          awardCheckinId: checkinId,
          proofLevel,
          description: 'Check-in',
        },
      });

      return this.applyBalanceDelta(tx, userId, amount);
    });
  }

  async awardEvidenceBonus(
    userId: string,
    checkinId: string,
    evidenceType: EvidenceType,
    delta: number,
    proofLevel: ProofLevel,
  ): Promise<PointsAwardResult> {
    if (delta <= 0) {
      return this.getBalance(userId);
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.pointTransaction.findFirst({
        where: { checkinId, evidenceType, type: PointTxnType.CHECKIN_EVIDENCE_BONUS },
      });
      if (existing) {
        return this.getBalanceInTx(tx, userId);
      }

      await tx.pointTransaction.create({
        data: {
          userId,
          amount: delta,
          type: PointTxnType.CHECKIN_EVIDENCE_BONUS,
          checkinId,
          evidenceType,
          proofLevel,
          description: `Bonus ${evidenceType}`,
        },
      });

      return this.applyBalanceDelta(tx, userId, delta);
    });
  }

  private async applyBalanceDelta(
    tx: Prisma.TransactionClient,
    userId: string,
    delta: number,
  ): Promise<PointsAwardResult> {
    const profile = await tx.touristProfile.update({
      where: { userId },
      data: { pointsBalance: { increment: delta } },
    });
    const level = levelFromBalance(profile.pointsBalance);
    if (profile.level !== level) {
      await tx.touristProfile.update({ where: { userId }, data: { level } });
    }
    return { delta, balance: profile.pointsBalance, level };
  }

  private async getBalanceInTx(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<PointsAwardResult> {
    const profile = await tx.touristProfile.findUniqueOrThrow({ where: { userId } });
    return { delta: 0, balance: profile.pointsBalance, level: profile.level };
  }

  async getBalance(userId: string): Promise<PointsAwardResult> {
    const profile = await this.prisma.touristProfile.findUniqueOrThrow({ where: { userId } });
    return { delta: 0, balance: profile.pointsBalance, level: profile.level };
  }

  async getSummary(userId: string): Promise<PointsSummary> {
    const profile = await this.prisma.touristProfile.findUniqueOrThrow({ where: { userId } });
    const agg = await this.prisma.pointTransaction.aggregate({
      where: { userId, amount: { gt: 0 } },
      _sum: { amount: true },
    });
    const lifetimePoints = agg._sum.amount ?? profile.pointsBalance;
    const next = pointsToNextLevel(profile.pointsBalance);
    return {
      balance: profile.pointsBalance,
      level: profile.level,
      levelLabel: levelLabel(profile.level),
      lifetimePoints,
      pointsToNextLevel: next.pointsToNextLevel,
      nextLevel: next.nextLevel,
    };
  }

  async listTransactions(
    userId: string,
    page: number,
    limit: number,
    type?: PointTxnType,
  ) {
    const where: Prisma.PointTransactionWhereInput = { userId };
    if (type) where.type = type;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { checkin: { include: { tourismSite: { select: { name: true } } } } },
      }),
      this.prisma.pointTransaction.count({ where }),
    ]);
    return {
      data: rows.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        proofLevel: tx.proofLevel,
        description:
          tx.description ??
          (tx.checkin?.tourismSite?.name ? `Check-in ${tx.checkin.tourismSite.name}` : null),
        createdAt: tx.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async debitForVoucherClaim(
    userId: string,
    amount: number,
    voucherClaimId: string,
  ): Promise<PointsAwardResult> {
    if (amount <= 0) {
      return this.getBalance(userId);
    }

    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.touristProfile.findUniqueOrThrow({ where: { userId } });
      if (profile.pointsBalance < amount) {
        throw new ApiException(
          'POINTS_INSUFFICIENT',
          'Không đủ điểm để claim voucher.',
          403,
        );
      }

      await tx.pointTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: PointTxnType.VOUCHER_CLAIM,
          voucherClaimId,
          description: 'Claim voucher',
        },
      });

      return this.applyBalanceDelta(tx, userId, -amount);
    });
  }

  async reverseCheckinPoints(userId: string, checkinId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existingVoid = await tx.pointTransaction.findFirst({
        where: { checkinId, type: PointTxnType.ADMIN_ADJUST, amount: { lt: 0 } },
      });
      if (existingVoid) return;

      const txns = await tx.pointTransaction.findMany({
        where: {
          userId,
          checkinId,
          amount: { gt: 0 },
          type: { in: [PointTxnType.CHECKIN_AWARD, PointTxnType.CHECKIN_EVIDENCE_BONUS] },
        },
      });
      const total = txns.reduce((sum, t) => sum + t.amount, 0);
      if (total <= 0) return;

      await tx.pointTransaction.create({
        data: {
          userId,
          amount: -total,
          type: PointTxnType.ADMIN_ADJUST,
          checkinId,
          description: 'Void check-in',
        },
      });

      await this.applyBalanceDelta(tx, userId, -total);
    });
  }
}
