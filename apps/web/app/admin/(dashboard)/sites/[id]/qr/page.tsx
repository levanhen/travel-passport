'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchQrToken, QrTokenResponse } from '@/app/admin/_lib/qr';

function secondsUntil(iso: string) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

export default function QrKioskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<QrTokenResponse | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exitHold, setExitHold] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const token = await fetchQrToken(params.id);
      setData(token);
      setCountdown(secondsUntil(token.expiresAt));
      setError(null);
    } catch {
      setError('Không lấy được QR token.');
    }
  }, [params.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!data) return;
    const tick = setInterval(() => {
      const left = secondsUntil(data.expiresAt);
      setCountdown(left);
      if (left <= 10) refresh();
    }, 1000);
    return () => clearInterval(tick);
  }, [data, refresh]);

  function onExitPointerDown() {
    const start = Date.now();
    const timer = setInterval(() => {
      const held = Date.now() - start;
      setExitHold(Math.min(100, (held / 2000) * 100));
      if (held >= 2000) {
        clearInterval(timer);
        router.push(`/admin/sites/${params.id}`);
      }
    }, 50);
    function clear() {
      clearInterval(timer);
      setExitHold(0);
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('pointerleave', clear);
    }
    window.addEventListener('pointerup', clear);
    window.addEventListener('pointerleave', clear);
  }

  const qrUrl = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(data.token)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm text-gray-400">{data?.siteName ?? 'QR kiosk'}</p>
        <button
          type="button"
          className="relative overflow-hidden rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-300"
          onPointerDown={onExitPointerDown}
        >
          <span
            className="absolute inset-y-0 left-0 bg-gray-700 transition-all"
            style={{ width: `${exitHold}%` }}
          />
          <span className="relative">Giữ 2s để thoát</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {error && <p className="text-red-400">{error}</p>}
        {qrUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt="QR check-in" className="rounded-xl bg-white p-3" width={320} height={320} />
        )}
        {data && (
          <>
            <p className="font-mono text-lg tracking-widest">{data.token.slice(0, 8)}…</p>
            <p className="text-sm text-gray-400">Làm mới sau {countdown}s</p>
          </>
        )}
      </div>

      <p className="pb-6 text-center text-xs text-gray-500">
        <Link href={`/admin/sites/${params.id}`} className="underline">
          Quay lại site
        </Link>
      </p>
    </div>
  );
}
