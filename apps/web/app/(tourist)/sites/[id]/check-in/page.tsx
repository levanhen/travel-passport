'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/toast';
import { ApiRequestError } from '@/app/(tourist)/_lib/api';
import { createCatalogCheckin, createPartnerCheckin } from '@/app/(tourist)/_lib/check-in';
import { DEMO_SKIP_GEOFENCE } from '@/app/(tourist)/_lib/demo';
import { checkGeofence, formatGeofenceMessage } from '@/app/(tourist)/_lib/geofence';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { StepProgress } from '@/app/(tourist)/_components/step-progress';
import { fetchSite, Site } from '@/app/(tourist)/_lib/sites';

type GeoState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ready'; lat: number; lng: number; accuracy: number }
  | { status: 'denied' }
  | { status: 'error' };

export default function SiteCheckInPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const siteId = params.id;

  const [site, setSite] = useState<Site | null>(null);
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSite(siteId).then(setSite).catch(() => toast.showError('Không tải được thông tin điểm.'));
  }, [siteId, toast]);

  useEffect(() => {
    if (!site || !DEMO_SKIP_GEOFENCE) return;
    setGeo({
      status: 'ready',
      lat: site.latitude,
      lng: site.longitude,
      accuracy: 10,
    });
  }, [site]);

  const geofence = useMemo(() => {
    if (!site || geo.status !== 'ready') return null;
    return checkGeofence(geo.lat, geo.lng, site.latitude, site.longitude, site.geofenceRadiusMeters);
  }, [site, geo]);

  const canSubmit =
    !!site &&
    geo.status === 'ready' &&
    (DEMO_SKIP_GEOFENCE || geofence?.withinGeofence === true) &&
    !submitting;

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeo({ status: 'error' });
      return;
    }
    setGeo({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          status: 'ready',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => setGeo({ status: 'denied' }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function onCheckIn() {
    if (!site || geo.status !== 'ready' || !canSubmit) return;

    const lat = DEMO_SKIP_GEOFENCE ? site.latitude : geo.lat;
    const lng = DEMO_SKIP_GEOFENCE ? site.longitude : geo.lng;
    const accuracy = DEMO_SKIP_GEOFENCE ? 10 : Math.round(geo.accuracy);

    setSubmitting(true);
    try {
      const result =
        site.participationLevel === 'partner'
          ? await createPartnerCheckin(site.id, lat, lng, accuracy)
          : await createCatalogCheckin(site.id, lat, lng, accuracy);

      sessionStorage.setItem('tp_last_checkin', JSON.stringify(result));
      router.push(`/check-in/success?id=${result.checkin.id}`);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.code === 'CHECKIN_GEOFENCE_FAILED' && geofence) {
          toast.showError(formatGeofenceMessage(geofence));
        } else if (e.code === 'CHECKIN_ALREADY_TODAY') {
          toast.showError('Bạn đã check-in hôm nay. Xem passport hoặc bổ sung bằng chứng.');
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

  return (
    <div className="space-y-6">
      <Link href={`/sites/${siteId}`} className="tp-link text-sm">
        ← Quay lại
      </Link>

      <header>
        <h1 className="tp-page-title">Check-in</h1>
        <p className="tp-page-subtitle mt-1">{site?.name ?? '…'}</p>
      </header>

      <StepProgress current={geo.status === 'ready' ? 2 : 1} />

      {DEMO_SKIP_GEOFENCE && (
        <p className="tp-alert-warning text-sm">
          Chế độ demo: geofence tắt — có thể check-in từ xa. Tắt{' '}
          <code className="text-xs">CHECKIN_SKIP_GEOFENCE</code> /{' '}
          <code className="text-xs">NEXT_PUBLIC_DEMO_SKIP_GEOFENCE</code> trước production.
        </p>
      )}

      <div className="tp-card space-y-3">
        <p className="text-sm text-gray-700">
          {DEMO_SKIP_GEOFENCE
            ? 'Demo: dùng tọa độ điểm để check-in, không cần đứng tại chỗ.'
            : 'Cần vị trí GPS một lần để xác nhận bạn đang tại điểm. Chúng tôi không theo dõi hành trình liên tục.'}
        </p>

        {!DEMO_SKIP_GEOFENCE && geo.status === 'idle' && (
          <button type="button" className="tp-btn tp-btn-primary w-full" onClick={requestLocation}>
            Lấy vị trí GPS
          </button>
        )}

        {geo.status === 'locating' && <p className="text-muted">Đang xác định vị trí…</p>}

        {geo.status === 'denied' && (
          <p className="tp-alert-error">Cần quyền truy cập vị trí để check-in.</p>
        )}

        {geo.status === 'error' && (
          <p className="tp-alert-error">Thiết bị không hỗ trợ GPS.</p>
        )}

        {geo.status === 'ready' && (
          <div className="space-y-2 text-sm">
            <p className="text-muted">
              Vị trí gửi: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
              {DEMO_SKIP_GEOFENCE ? ' (tọa độ điểm)' : ` · Độ chính xác ~${Math.round(geo.accuracy)}m`}
            </p>
            {!DEMO_SKIP_GEOFENCE && geo.accuracy > 100 && (
              <p className="tp-alert-warning">GPS chưa ổn định — thử ra ngoài trời.</p>
            )}
            {geofence && (
              <p className={geofence.withinGeofence ? 'tp-alert-success' : 'tp-alert-warning'}>
                {DEMO_SKIP_GEOFENCE
                  ? 'Demo: bỏ qua kiểm tra khoảng cách.'
                  : formatGeofenceMessage(geofence)}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="tp-btn tp-btn-primary w-full"
        disabled={!canSubmit}
        onClick={onCheckIn}
      >
        {submitting ? 'Đang check-in…' : 'Xác nhận check-in'}
      </button>

      {geo.status === 'ready' && geofence && !geofence.withinGeofence && !DEMO_SKIP_GEOFENCE && (
        <p className="text-center text-xs text-muted">
          Di chuyển vào vùng {Math.round(geofence.radiusMeters)}m quanh điểm để bật nút check-in.
        </p>
      )}

      <p className="text-center text-xs text-muted">
        Sau check-in, có thể chụp ảnh tại chỗ (+15 điểm) trong 30 phút.
        {site?.participationLevel === 'partner' && ' Quét QR tại quầy nếu có.'}
      </p>
    </div>
  );
}
