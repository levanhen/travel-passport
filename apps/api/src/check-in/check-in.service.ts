import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CheckinStatus,
  DestinationStatus,
  EvidenceType,
  OrganizationStatus,
  ParticipationLevel,
  ProofLevel,
  SiteStatus,
  TourismSite,
} from '@tp/db';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../auth/jwt-auth.guard';
import { hashDeviceId } from '../auth/auth.util';
import { BadgesService } from '../badges/badges.service';
import { PointsService } from '../points/points.service';
import { ApiException } from '../shared/api.exception';
import { PrismaService } from '../shared/prisma.service';
import { RedisService } from '../shared/redis.service';
import { CheckInQrService } from './check-in-qr.service';
import {
  CheckinReadModel,
  computeTotalPoints,
  RewardsReadModel,
  toCheckinReadModel,
} from './check-in.mapper';
import { CreatePartnerCheckinDto, CreateSelfCheckinDto } from './dto/check-in.dto';
import { geofenceCheck } from './utils/geofence.util';
import { getLocalDateVN, getUpgradeWindowMinutes } from './utils/local-date.util';
import { EvidenceFlag } from './utils/points.util';
import {
  computeProofLevel,
  evidenceFlagsFromSnapshots,
  EvidenceSnapshot,
} from './utils/proof.util';
import { hashQrToken, idempotencyRedisKey } from './utils/qr.util';

type CreateInput = CreateSelfCheckinDto | CreatePartnerCheckinDto;

@Injectable()
export class CheckInService {
  private readonly uploadDir =
    process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads', 'checkin');

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly qr: CheckInQrService,
    private readonly points: PointsService,
    private readonly badges: BadgesService,
  ) {}

  async createSelf(user: JwtPayload, dto: CreateSelfCheckinDto, idempotencyKey?: string) {
    const site = await this.loadSite(dto.siteId);
    if (site.participationLevel !== ParticipationLevel.catalog) {
      throw new ApiException('SITE_NOT_CATALOG', 'Điểm không hỗ trợ check-in tự phục vụ.', 400);
    }
    this.qr.assertQrAllowedForCatalog(site, dto.qrToken);
    return this.createCheckin(user, dto, site, idempotencyKey);
  }

  async createPartner(user: JwtPayload, dto: CreatePartnerCheckinDto, idempotencyKey?: string) {
    const site = await this.loadSite(dto.siteId);
    if (site.participationLevel !== ParticipationLevel.partner) {
      throw new ApiException('SITE_NOT_PARTNER', 'Điểm không phải đối tác check-in quầy.', 400);
    }
    return this.createCheckin(user, dto, site, idempotencyKey);
  }

  async addQrEvidence(
    user: JwtPayload,
    checkinId: string,
    body: {
      qrToken?: string;
      latitude: number;
      longitude: number;
      deviceId: string;
    },
  ) {
    const checkin = await this.loadOwnedCheckin(user.sub, checkinId);
    this.assertUpgradeWindow(checkin);

    const existingQr = checkin.evidences.find((e) => e.type === EvidenceType.qr);
    if (existingQr) {
      throw new ApiException('CHECKIN_EVIDENCE_EXISTS', 'Đã có bằng chứng QR.', 409);
    }

    const site = checkin.tourismSite;
    const qrResult = await this.qr.resolveQrEvidence(
      site,
      body.qrToken,
      body.latitude,
      body.longitude,
    );
    if (!qrResult.valid) {
      throw new ApiException('CHECKIN_QR_INVALID', 'Mã QR không hợp lệ hoặc đã hết hạn.', 400);
    }

    const siteLat = Number(site.latitude.toString());
    const siteLng = Number(site.longitude.toString());
    const gpsGeo = geofenceCheck(body.latitude, body.longitude, siteLat, siteLng, site.geofenceRadiusMeters);

    await this.prisma.checkinEvidence.create({
      data: {
        checkinId,
        type: EvidenceType.qr,
        latitude: body.latitude,
        longitude: body.longitude,
        withinGeofence: qrResult.withinGeofence ?? gpsGeo.withinGeofence,
        qrMode: qrResult.qrMode,
        qrTokenHash: body.qrToken ? hashQrToken(body.qrToken) : null,
        deviceIdHash: hashDeviceId(body.deviceId),
      },
    });

    return this.finalizeEvidenceUpdate(checkinId, user.sub);
  }

  async addPhotoEvidence(
    user: JwtPayload,
    checkinId: string,
    file: Express.Multer.File,
    deviceId: string,
  ) {
    if (!file?.buffer?.length) {
      throw new ApiException('VALIDATION_ERROR', 'Thiếu ảnh.', 400);
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new ApiException('VALIDATION_ERROR', 'Ảnh tối đa 5MB.', 400);
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new ApiException('VALIDATION_ERROR', 'Chỉ hỗ trợ JPEG/WEBP.', 400);
    }

    const checkin = await this.loadOwnedCheckin(user.sub, checkinId);
    this.assertUpgradeWindow(checkin);

    if (checkin.evidences.some((e) => e.type === EvidenceType.photo)) {
      throw new ApiException('CHECKIN_EVIDENCE_EXISTS', 'Đã có ảnh check-in.', 409);
    }

    await mkdir(this.uploadDir, { recursive: true });
    const ext = file.mimetype.includes('webp') ? 'webp' : 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const objectKey = `checkin/${filename}`;
    await writeFile(join(this.uploadDir, filename), file.buffer);

    await this.prisma.checkinEvidence.create({
      data: {
        checkinId,
        type: EvidenceType.photo,
        photoObjectKey: objectKey,
        deviceIdHash: hashDeviceId(deviceId),
      },
    });

    return this.finalizeEvidenceUpdate(checkinId, user.sub);
  }

  async getOne(user: JwtPayload, id: string): Promise<CheckinReadModel> {
    const checkin = await this.loadOwnedCheckin(user.sub, id);
    return toCheckinReadModel(checkin);
  }

  async list(user: JwtPayload, page = 1, limit = 20) {
    const where = { userId: user.sub, status: CheckinStatus.confirmed };
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.checkin.findMany({
        where,
        include: { tourismSite: true },
        orderBy: { checkedInAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkin.count({ where }),
    ]);
    return {
      data: rows.map((c) => toCheckinReadModel(c)),
      meta: { page, limit, total },
    };
  }

  private async createCheckin(
    user: JwtPayload,
    dto: CreateInput,
    site: TourismSite,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cachedId = await this.redis.get(idempotencyRedisKey(idempotencyKey));
      if (cachedId) {
        const existing = await this.prisma.checkin.findUnique({
          where: { id: cachedId },
          include: { tourismSite: true },
        });
        if (existing && existing.userId === user.sub) {
          return this.buildCreateResponse(existing, 0, []);
        }
      }
    }

    this.qr.assertSiteCheckInEnabled(site);
    this.assertTouristSiteVisible(site);

    const siteLat = Number(site.latitude.toString());
    const siteLng = Number(site.longitude.toString());
    const geo = geofenceCheck(dto.latitude, dto.longitude, siteLat, siteLng, site.geofenceRadiusMeters);
    if (!geo.withinGeofence) {
      throw new ApiException('CHECKIN_GEOFENCE_FAILED', 'Bạn chưa ở đủ gần điểm này.', 400);
    }

    const localDate = getLocalDateVN();
    const dup = await this.prisma.checkin.findFirst({
      where: {
        userId: user.sub,
        tourismSiteId: site.id,
        localDate,
        status: CheckinStatus.confirmed,
      },
    });
    if (dup) {
      throw new ApiException('CHECKIN_ALREADY_TODAY', 'Bạn đã check-in tại điểm này hôm nay.', 409);
    }

    const qrResult = dto.qrToken
      ? await this.qr.resolveQrEvidence(site, dto.qrToken, dto.latitude, dto.longitude)
      : { valid: false as const, qrMode: null, withinGeofence: null };

    const now = new Date();
    const upgradeMinutes = getUpgradeWindowMinutes();
    const upgradeExpiresAt = new Date(now.getTime() + upgradeMinutes * 60 * 1000);

    const evidenceInputs: EvidenceSnapshot[] = [
      { type: 'gps', withinGeofence: true },
    ];
    if (qrResult.valid) {
      evidenceInputs.push({
        type: 'qr',
        withinGeofence: qrResult.withinGeofence ?? true,
      });
    }

    const proofLevel = computeProofLevel(evidenceInputs);
    const evidenceFlags = evidenceFlagsFromSnapshots(evidenceInputs) as EvidenceFlag[];
    const pointsAwarded = computeTotalPoints(evidenceFlags, true);

    const checkin = await this.prisma.$transaction(async (tx) => {
      const row = await tx.checkin.create({
        data: {
          userId: user.sub,
          tourismSiteId: site.id,
          destinationId: site.destinationId,
          participationLevel: site.participationLevel,
          proofLevel,
          evidenceFlags,
          pointsAwarded,
          status: CheckinStatus.confirmed,
          checkedInAt: now,
          upgradeExpiresAt,
          localDate,
        },
        include: { tourismSite: true },
      });

      await tx.checkinEvidence.create({
        data: {
          checkinId: row.id,
          type: EvidenceType.gps,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracyMeters: dto.accuracyMeters ?? null,
          distanceMeters: geo.distanceMeters,
          withinGeofence: true,
          deviceIdHash: hashDeviceId(dto.deviceId),
        },
      });

      if (qrResult.valid) {
        await tx.checkinEvidence.create({
          data: {
            checkinId: row.id,
            type: EvidenceType.qr,
            latitude: dto.latitude,
            longitude: dto.longitude,
            withinGeofence: qrResult.withinGeofence ?? true,
            qrMode: qrResult.qrMode,
            qrTokenHash: dto.qrToken ? hashQrToken(dto.qrToken) : null,
            deviceIdHash: hashDeviceId(dto.deviceId),
          },
        });
      }

      await tx.checkinProof.create({
        data: {
          checkinId: row.id,
          proofLevel,
          evidenceFlags,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracyMeters: dto.accuracyMeters ?? null,
          qrMode: qrResult.qrMode,
          deviceIdHash: hashDeviceId(dto.deviceId),
        },
      });

      return row;
    });

    const pointsResult = await this.points.awardCheckinCreate(
      user.sub,
      checkin.id,
      pointsAwarded,
      proofLevel,
    );
    const badgesUnlocked = await this.badges.evaluateForUser(
      user.sub,
      checkin.id,
      site.destinationId,
    );

    if (idempotencyKey) {
      await this.redis.setex(idempotencyRedisKey(idempotencyKey), 86400, checkin.id);
    }

    return this.buildCreateResponse(checkin, pointsResult.delta, badgesUnlocked, pointsResult);
  }

  private async finalizeEvidenceUpdate(checkinId: string, userId: string) {
    const checkin = await this.prisma.checkin.findUniqueOrThrow({
      where: { id: checkinId },
      include: { evidences: true, tourismSite: true },
    });

    const snapshots: EvidenceSnapshot[] = checkin.evidences.map((e) => ({
      type: e.type as 'gps' | 'qr' | 'photo',
      withinGeofence: e.withinGeofence,
    }));

    const proofLevel = computeProofLevel(snapshots);
    const evidenceFlags = evidenceFlagsFromSnapshots(snapshots) as EvidenceFlag[];
    const gpsInGeofence = snapshots.some((s) => s.type === 'gps' && s.withinGeofence === true);
    const newTotal = computeTotalPoints(evidenceFlags, gpsInGeofence);
    const delta = newTotal - checkin.pointsAwarded;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.checkin.update({
        where: { id: checkinId },
        data: { proofLevel, evidenceFlags, pointsAwarded: newTotal },
        include: { tourismSite: true, evidences: true },
      });

      const latestGps = row.evidences.find((e) => e.type === EvidenceType.gps);
      const latestQr = row.evidences.find((e) => e.type === EvidenceType.qr);
      await tx.checkinProof.update({
        where: { checkinId },
        data: {
          proofLevel,
          evidenceFlags,
          latitude: latestGps?.latitude ?? latestQr?.latitude,
          longitude: latestGps?.longitude ?? latestQr?.longitude,
          qrMode: latestQr?.qrMode ?? null,
        },
      });

      return row;
    });

    let pointsResult = await this.points.getBalance(userId);
    if (delta > 0) {
      const newEvidence = updated.evidences.find(
        (e) => !checkin.evidenceFlags.includes(e.type),
      );
      pointsResult = await this.points.awardEvidenceBonus(
        userId,
        checkinId,
        newEvidence?.type ?? EvidenceType.qr,
        delta,
        proofLevel,
      );
    }

    const badgesUnlocked = await this.badges.evaluateForUser(
      userId,
      checkinId,
      updated.destinationId,
    );

    return {
      checkin: toCheckinReadModel(updated),
      rewards: this.buildRewards(newTotal, pointsResult.delta, pointsResult, badgesUnlocked),
    };
  }

  private buildCreateResponse(
    checkin: Parameters<typeof toCheckinReadModel>[0],
    pointsDelta: number,
    badgesUnlocked: { id: string; slug: string; name: string }[],
    pointsResult?: { balance: number; level: string; delta: number },
  ) {
    const balance = pointsResult?.balance ?? 0;
    const level = pointsResult?.level ?? 'TRAVELLER';
    return {
      checkin: toCheckinReadModel(checkin),
      rewards: this.buildRewards(checkin.pointsAwarded, pointsDelta, {
        balance,
        level,
      }, badgesUnlocked),
    };
  }

  private buildRewards(
    pointsAwarded: number,
    pointsDelta: number,
    pointsResult: { balance: number; level: string },
    badgesUnlocked: { id: string; slug: string; name: string }[],
  ): RewardsReadModel {
    return {
      pointsAwarded,
      pointsDelta,
      balance: pointsResult.balance,
      level: pointsResult.level,
      badgesUnlocked,
    };
  }

  private async loadSite(siteId: string): Promise<TourismSite> {
    const site = await this.prisma.tourismSite.findFirst({
      where: { id: siteId, deletedAt: null },
      include: { destination: true, organization: true },
    });
    if (!site) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    return site;
  }

  private assertTouristSiteVisible(site: TourismSite & { destination?: { status: DestinationStatus }; organization?: { status: OrganizationStatus } | null }) {
    if (site.status !== SiteStatus.published || !site.checkInEnabled) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    if (site.destination?.status !== DestinationStatus.published) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
    if (
      site.participationLevel === ParticipationLevel.partner &&
      site.organization?.status !== OrganizationStatus.active
    ) {
      throw new ApiException('NOT_FOUND', 'Không tìm thấy.', HttpStatus.NOT_FOUND);
    }
  }

  private async loadOwnedCheckin(userId: string, checkinId: string) {
    const checkin = await this.prisma.checkin.findFirst({
      where: { id: checkinId, userId },
      include: { tourismSite: true, evidences: true },
    });
    if (!checkin) {
      throw new ApiException('CHECKIN_NOT_FOUND', 'Không tìm thấy check-in.', 404);
    }
    if (checkin.status !== CheckinStatus.confirmed) {
      throw new ApiException('CHECKIN_NOT_FOUND', 'Không tìm thấy check-in.', 404);
    }
    return checkin;
  }

  private assertUpgradeWindow(checkin: { upgradeExpiresAt: Date }) {
    if (new Date() > checkin.upgradeExpiresAt) {
      throw new ApiException('CHECKIN_UPGRADE_EXPIRED', 'Đã hết thời gian bổ sung bằng chứng.', 400);
    }
  }
}
