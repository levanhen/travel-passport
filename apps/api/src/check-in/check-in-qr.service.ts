import { Injectable } from '@nestjs/common';
import {
  ParticipationLevel,
  QrMode,
  SiteStatus,
  TourismSite,
} from '@tp/db';
import { ApiException } from '../shared/api.exception';
import { RedisService } from '../shared/redis.service';
import { geofenceCheck } from './utils/geofence.util';
import { getQrTtlSeconds, hashQrToken, newQrToken, qrRedisKey } from './utils/qr.util';

@Injectable()
export class CheckInQrService {
  constructor(private readonly redis: RedisService) {}

  async issueRotatingToken(siteId: string): Promise<{ token: string; expiresAt: string }> {
    const token = newQrToken();
    const tokenHash = hashQrToken(token);
    const ttl = getQrTtlSeconds();
    await this.redis.setex(qrRedisKey(siteId, tokenHash), ttl, '1');
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    return { token, expiresAt };
  }

  async validateRotatingToken(siteId: string, qrToken: string): Promise<boolean> {
    const tokenHash = hashQrToken(qrToken);
    const key = qrRedisKey(siteId, tokenHash);
    const val = await this.redis.getdel(key);
    return val === '1';
  }

  assertQrAllowedForCatalog(site: TourismSite, qrToken: string | null | undefined) {
    if (site.participationLevel !== ParticipationLevel.catalog) return;
    if (!qrToken) return;
    if (site.qrMode === QrMode.rotating) {
      throw new ApiException(
        'CHECKIN_QR_NOT_SUPPORTED',
        'Điểm catalog không hỗ trợ QR xoay.',
        400,
      );
    }
    if (!site.staticQrEnabled) {
      throw new ApiException(
        'CHECKIN_QR_NOT_SUPPORTED',
        'Điểm này chưa bật QR tĩnh.',
        400,
      );
    }
  }

  async resolveQrEvidence(
    site: TourismSite,
    qrToken: string | null | undefined,
    latitude: number | undefined,
    longitude: number | undefined,
  ): Promise<{ valid: boolean; qrMode: QrMode | null; withinGeofence: boolean | null }> {
    if (!qrToken && site.qrMode !== QrMode.static) {
      return { valid: false, qrMode: null, withinGeofence: null };
    }

    const siteLat = Number(site.latitude.toString());
    const siteLng = Number(site.longitude.toString());

    if (site.participationLevel === ParticipationLevel.partner) {
      if (site.qrMode === QrMode.rotating) {
        if (!qrToken) return { valid: false, qrMode: QrMode.rotating, withinGeofence: null };
        const ok = await this.validateRotatingToken(site.id, qrToken);
        if (!ok) {
          throw new ApiException('CHECKIN_QR_INVALID', 'Mã QR không hợp lệ hoặc đã hết hạn.', 400);
        }
        const geo =
          latitude != null && longitude != null
            ? geofenceCheck(latitude, longitude, siteLat, siteLng, site.geofenceRadiusMeters)
            : { withinGeofence: null as boolean | null };
        return { valid: true, qrMode: QrMode.rotating, withinGeofence: geo.withinGeofence };
      }

      // static partner
      if (latitude == null || longitude == null) {
        throw new ApiException('CHECKIN_GEOFENCE_FAILED', 'Bạn chưa ở đủ gần điểm này.', 400);
      }
      const geo = geofenceCheck(latitude, longitude, siteLat, siteLng, site.geofenceRadiusMeters);
      if (!geo.withinGeofence) {
        throw new ApiException('CHECKIN_GEOFENCE_FAILED', 'Bạn chưa ở đủ gần điểm này.', 400);
      }
      return { valid: true, qrMode: QrMode.static, withinGeofence: true };
    }

    // catalog static
    if (!site.staticQrEnabled) {
      return { valid: false, qrMode: null, withinGeofence: null };
    }
    if (latitude == null || longitude == null) {
      throw new ApiException('CHECKIN_GEOFENCE_FAILED', 'Bạn chưa ở đủ gần điểm này.', 400);
    }
    const geo = geofenceCheck(latitude, longitude, siteLat, siteLng, site.geofenceRadiusMeters);
    if (!geo.withinGeofence) {
      throw new ApiException('CHECKIN_GEOFENCE_FAILED', 'Bạn chưa ở đủ gần điểm này.', 400);
    }
    return { valid: true, qrMode: QrMode.static, withinGeofence: true };
  }

  assertSiteCheckInEnabled(site: TourismSite) {
    if (site.status !== SiteStatus.published || !site.checkInEnabled) {
      throw new ApiException('SITE_CHECKIN_DISABLED', 'Điểm này chưa mở check-in.', 403);
    }
  }
}
