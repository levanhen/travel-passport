'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/app/_components/toast';
import { ApiRequestError } from '@/app/(tourist)/_lib/api';
import { addQrEvidence, fetchCheckin } from '@/app/(tourist)/_lib/check-in';
import { DEMO_SKIP_GEOFENCE } from '@/app/(tourist)/_lib/demo';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { getCheckinCoordinates } from '@/app/(tourist)/_lib/geolocation';
import { parseQrTokenInput } from '@/app/(tourist)/_lib/qr-input';
import { fetchSite } from '@/app/(tourist)/_lib/sites';

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ScanQrPage() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const checkinId = searchParams.get('checkinId') ?? '';
  const [qrInput, setQrInput] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteCoords, setSiteCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [upgradeExpiresAt, setUpgradeExpiresAt] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!checkinId) return;
    fetchCheckin(checkinId)
      .then(async (c) => {
        setSiteName(c.siteName);
        setUpgradeExpiresAt(c.upgradeExpiresAt);
        if (DEMO_SKIP_GEOFENCE) {
          const site = await fetchSite(c.siteId);
          setSiteCoords({ lat: site.latitude, lng: site.longitude });
        }
      })
      .catch(() => toast.showError('Không tải được thông tin check-in.'));
  }, [checkinId, toast]);

  useEffect(() => {
    if (!upgradeExpiresAt) return;
    const tick = () => {
      setRemainingMs(new Date(upgradeExpiresAt).getTime() - Date.now());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [upgradeExpiresAt]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!checkinId) {
      toast.showError('Thiếu mã check-in. Chọn từ lịch sử passport.');
      return;
    }
    const qrToken = parseQrTokenInput(qrInput);
    if (!qrToken) {
      toast.showError('Nhập hoặc dán mã QR từ màn hình quầy.');
      return;
    }

    setLoading(true);
    try {
      const coords = await getCheckinCoordinates(siteCoords ?? undefined);
      const result = await addQrEvidence(
        checkinId,
        coords.lat,
        coords.lng,
        qrToken,
      );
      sessionStorage.setItem('tp_last_checkin', JSON.stringify(result));
      toast.showSuccess('Đã xác nhận QR — nhận thêm điểm!');
      router.push(`/check-in/success?id=${checkinId}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.showError(getErrorMessage(err.code, err.message));
      } else {
        toast.showError('Cần GPS và mã QR hợp lệ.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onPaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setQrInput(text.trim());
    } catch {
      toast.showError('Không đọc được clipboard. Hãy dán thủ công.');
    }
  }

  const upgradeOpen = remainingMs > 0;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/passport/check-ins" className="tp-link text-sm">
          ← Lịch sử check-in
        </Link>
        <h1 className="tp-page-title mt-2">Quét QR quầy</h1>
        <p className="tp-page-subtitle mt-1">
          {siteName ? `Check-in tại ${siteName}` : 'Nâng cấp bằng chứng QR'}
        </p>
      </header>

      {DEMO_SKIP_GEOFENCE && (
        <p className="tp-alert-warning text-sm">Demo: geofence tắt — QR không cần đứng tại điểm.</p>
      )}

      {!checkinId && (
        <p className="tp-alert-error">
          Chọn check-in cần nâng cấp từ{' '}
          <Link href="/passport/check-ins" className="tp-link">
            lịch sử check-in
          </Link>{' '}
          hoặc trang thành công sau check-in.
        </p>
      )}

      {checkinId && upgradeExpiresAt && !upgradeOpen && (
        <p className="tp-alert-warning">Đã hết thời gian bổ sung bằng chứng (30 phút).</p>
      )}

      {checkinId && upgradeOpen && (
        <p className="text-sm text-muted">Còn {formatCountdown(remainingMs)} để quét QR.</p>
      )}

      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
        <li>Đến quầy lễ tân / kiosk QR của điểm.</li>
        <li>Sao chép mã từ màn hình quầy (hoặc dán deep link `tp://…`).</li>
        <li>Xác nhận — cần GPS trong vùng check-in.</li>
      </ol>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Mã QR / token</span>
          <textarea
            className="tp-input mt-1 min-h-[88px] w-full resize-y font-mono text-sm"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Dán mã token hoặc tp://checkin?token=…"
            required
            disabled={!checkinId || !upgradeOpen || (DEMO_SKIP_GEOFENCE && !siteCoords)}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            className="tp-btn tp-btn-secondary flex-1 text-sm"
            disabled={!checkinId || !upgradeOpen || (DEMO_SKIP_GEOFENCE && !siteCoords)}
            onClick={onPaste}
          >
            Dán từ clipboard
          </button>
        </div>

        <button
          type="submit"
          className="tp-btn tp-btn-primary w-full"
          disabled={loading || !checkinId || !upgradeOpen || (DEMO_SKIP_GEOFENCE && !siteCoords)}
        >
          {loading ? 'Đang xác nhận…' : 'Xác nhận QR'}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Camera scan sẽ có ở bản sau — hiện dán mã từ màn hình BO kiosk.
      </p>
    </div>
  );
}
