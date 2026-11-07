'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SiteCover } from '@/app/(tourist)/_components/site-cover';
import { StepProgress } from '@/app/(tourist)/_components/step-progress';
import { useToast } from '@/app/_components/toast';
import { ApiRequestError } from '@/app/(tourist)/_lib/api';
import {
  CheckinListItem,
  createCatalogCheckin,
  createPartnerCheckin,
  fetchCheckins,
} from '@/app/(tourist)/_lib/check-in';
import { findTodayCheckinForSite } from '@/app/(tourist)/_lib/check-in-status';
import { DEMO_SKIP_GEOFENCE } from '@/app/(tourist)/_lib/demo';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { formatGeofenceMessage } from '@/app/(tourist)/_lib/geofence';
import { getCheckinCoordinates } from '@/app/(tourist)/_lib/geolocation';
import {
  formatDistance,
  NearbySiteMatch,
  rankSitesByProximity,
  topNearbySites,
} from '@/app/(tourist)/_lib/nearby-sites';
import {
  categoryLabel,
  fetchDestinationSites,
  fetchPilotDestination,
  Site,
} from '@/app/(tourist)/_lib/sites';

type Phase =
  | { kind: 'locating' }
  | { kind: 'denied' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready';
      lat: number;
      lng: number;
      accuracy: number;
      matches: NearbySiteMatch[];
    };

async function performCheckin(
  site: Site,
  lat: number,
  lng: number,
  accuracy: number,
) {
  if (site.participationLevel === 'partner') {
    return createPartnerCheckin(site.id, lat, lng, Math.round(accuracy));
  }
  return createCatalogCheckin(site.id, lat, lng, Math.round(accuracy));
}

export default function CheckInHerePage() {
  const router = useRouter();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>({ kind: 'locating' });
  const [selected, setSelected] = useState<Site | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkins, setCheckins] = useState<CheckinListItem[]>([]);

  const loadNearby = useCallback(async () => {
    setPhase({ kind: 'locating' });
    setSelected(null);
    try {
      const dest = await fetchPilotDestination();
      const [sites, recentCheckins] = await Promise.all([
        fetchDestinationSites(dest.id),
        fetchCheckins().catch(() => []),
      ]);
      setCheckins(recentCheckins);

      const coords = await getCheckinCoordinates();
      const matches = rankSitesByProximity(sites, coords.lat, coords.lng);
      setPhase({
        kind: 'ready',
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        matches,
      });

      const quick = topNearbySites(matches);
      const readyToCheckin = quick.filter(
        (m) =>
          m.withinGeofence &&
          !findTodayCheckinForSite(recentCheckins, m.site.id),
      );
      if (readyToCheckin.length === 1) {
        setSelected(readyToCheckin[0].site);
      }
    } catch (e) {
      const geoDenied =
        (e instanceof GeolocationPositionError && e.code === e.PERMISSION_DENIED) ||
        (e as Error).message === 'no geo';
      if (geoDenied) {
        setPhase({ kind: 'denied' });
        return;
      }
      setPhase({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Không tải được dữ liệu.',
      });
    }
  }, []);

  useEffect(() => {
    loadNearby();
  }, [loadNearby]);

  function isCheckedInToday(siteId: string): boolean {
    return findTodayCheckinForSite(checkins, siteId) !== null;
  }

  async function onConfirm() {
    if (phase.kind !== 'ready' || !selected) return;
    if (isCheckedInToday(selected.id)) {
      toast.showError('Bạn đã check-in tại điểm này hôm nay.');
      return;
    }
    setSubmitting(true);
    try {

      const lat = DEMO_SKIP_GEOFENCE ? selected.latitude : phase.lat;
      const lng = DEMO_SKIP_GEOFENCE ? selected.longitude : phase.lng;
      const result = await performCheckin(selected, lat, lng, phase.accuracy);
      sessionStorage.setItem('tp_last_checkin', JSON.stringify(result));
      router.push(`/check-in/success?id=${result.checkin.id}`);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.code === 'CHECKIN_ALREADY_TODAY') {
          toast.showError('Bạn đã check-in tại điểm này hôm nay.');
        } else if (e.code === 'CHECKIN_GEOFENCE_FAILED') {
          toast.showError(getErrorMessage(e.code, e.message));
        } else {
          toast.showError(getErrorMessage(e.code, e.message));
        }
      } else {
        toast.showError(getErrorMessage('UNKNOWN'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const quickSites = phase.kind === 'ready' ? topNearbySites(phase.matches) : [];
  const hasInRangeQuick = quickSites.some((m) => m.withinGeofence);
  const selectedMatch =
    phase.kind === 'ready' && selected
      ? phase.matches.find((m) => m.site.id === selected.id)
      : null;

  return (
    <div className="space-y-6">
      <Link href="/" className="tp-link text-sm">
        ← Trang chủ
      </Link>

      <header>
        <p className="text-sm font-medium text-ocean">Check-in nhanh</p>
        <h1 className="tp-page-title mt-1">Tôi đang ở đây</h1>
        <p className="tp-page-subtitle mt-1">
          Dùng GPS để tìm điểm gần bạn — không cần quét QR.
        </p>
      </header>

      <StepProgress current={phase.kind === 'ready' && selected ? 2 : 1} />

      {DEMO_SKIP_GEOFENCE && (
        <p className="tp-alert-warning text-sm">
          Demo: geofence tắt — mọi điểm đều trong vùng check-in.
        </p>
      )}

      {phase.kind === 'locating' && (
        <div className="tp-card py-8 text-center">
          <p className="text-muted">Đang xác định vị trí GPS…</p>
        </div>
      )}

      {phase.kind === 'denied' && (
        <div className="tp-card space-y-3 text-center">
          <p className="tp-alert-error">Cần quyền truy cập vị trí để check-in.</p>
          <button type="button" className="tp-btn tp-btn-primary w-full" onClick={loadNearby}>
            Thử lại
          </button>
          <Link href="/sites" className="tp-link text-sm">
            Hoặc chọn điểm trong danh sách →
          </Link>
        </div>
      )}

      {phase.kind === 'error' && (
        <div className="tp-card space-y-3">
          <p className="tp-alert-error">{phase.message}</p>
          <button type="button" className="tp-btn tp-btn-primary w-full" onClick={loadNearby}>
            Thử lại
          </button>
        </div>
      )}

      {phase.kind === 'ready' && (
        <>
          <p className="text-center text-xs text-muted">
            Độ chính xác GPS ~{Math.round(phase.accuracy)}m
            {!DEMO_SKIP_GEOFENCE && phase.accuracy > 100 && ' · Thử ra ngoài trời nếu không thấy điểm'}
          </p>

          {!hasInRangeQuick && quickSites.length > 0 && (
            <div className="tp-card space-y-2 text-center">
              <p className="font-medium text-gray-900">Chưa có điểm trong vùng check-in</p>
              <p className="text-sm text-muted">
                Di chuyển gần hơn — dưới đây là 3 điểm gần bạn nhất.
              </p>
            </div>
          )}

          {quickSites.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">3 điểm gần nhất</h2>
              <ul className="space-y-2">
                {quickSites.map(({ site, distanceMeters, withinGeofence }) => {
                  const done = isCheckedInToday(site.id);
                  const active = selected?.id === site.id;
                  const canSelect = withinGeofence && !done;

                  if (!withinGeofence) {
                    return (
                      <li key={site.id} className="tp-card flex items-center gap-3 p-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl opacity-80">
                          <SiteCover
                            name={site.name}
                            category={site.category}
                            slug={site.slug}
                            aspect="card"
                            className="h-full w-full [&>div]:h-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{site.name}</p>
                          <p className="text-xs text-muted">
                            {categoryLabel(site.category)} · Cách ~{formatDistance(distanceMeters)}
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700">Ngoài vùng check-in</p>
                        </div>
                        <Link
                          href={`/sites/${site.id}`}
                          className="tp-btn tp-btn-secondary shrink-0 text-xs"
                        >
                          Xem
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={site.id}>
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => canSelect && setSelected(site)}
                        className={`w-full overflow-hidden rounded-2xl border text-left transition-shadow ${
                          active
                            ? 'border-primary ring-2 ring-primary/20 shadow-card'
                            : 'border-border bg-white hover:shadow-sm'
                        } ${done ? 'opacity-60' : ''}`}
                      >
                        <div className="flex gap-3 p-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                            <SiteCover
                              name={site.name}
                              category={site.category}
                              slug={site.slug}
                              aspect="card"
                              className="h-full w-full [&>div]:h-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">{site.name}</p>
                            <p className="text-xs text-muted">
                              {categoryLabel(site.category)} · ~{formatDistance(distanceMeters)}
                            </p>
                            {done ? (
                              <p className="mt-1 text-xs font-medium text-primary">
                                Đã check-in hôm nay
                              </p>
                            ) : (
                              <p className="mt-1 text-xs text-emerald-700">
                                Sẵn sàng check-in (+25 điểm)
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link href="/sites" className="tp-link block text-center text-sm">
                Xem tất cả điểm du lịch →
              </Link>
            </section>
          )}

          {selected &&
            selectedMatch?.withinGeofence &&
            !isCheckedInToday(selected.id) && (
            <div className="space-y-3 border-t border-border/60 pt-4">
              <p className="text-sm text-gray-700">
                Xác nhận check-in tại <strong>{selected.name}</strong>. Chỉ cần GPS — chụp ảnh sau
                nếu muốn thêm +15 điểm.
              </p>
              {!DEMO_SKIP_GEOFENCE && selectedMatch && (
                <p className="text-xs text-muted">
                  {formatGeofenceMessage({
                    distanceMeters: selectedMatch.distanceMeters,
                    radiusMeters: selected.geofenceRadiusMeters,
                    withinGeofence: selectedMatch.withinGeofence,
                  })}
                </p>
              )}
              <button
                type="button"
                className="tp-btn tp-btn-primary w-full"
                disabled={submitting}
                onClick={onConfirm}
              >
                {submitting ? 'Đang check-in…' : 'Xác nhận check-in'}
              </button>
            </div>
          )}

          <button type="button" className="tp-btn tp-btn-ghost w-full text-sm" onClick={loadNearby}>
            Làm mới vị trí
          </button>
        </>
      )}
    </div>
  );
}
