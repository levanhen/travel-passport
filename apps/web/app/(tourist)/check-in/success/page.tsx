'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BadgeCard } from '@/app/(tourist)/_components/badge-card';
import { CheckinResult } from '@/app/(tourist)/_lib/check-in';
import { useInvalidateTouristData } from '@/app/(tourist)/_lib/queries';

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CheckInSuccessPage() {
  const searchParams = useSearchParams();
  const checkinId = searchParams.get('id');
  const invalidate = useInvalidateTouristData();
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem('tp_last_checkin');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CheckinResult;
        setResult(parsed);
        invalidate.afterCheckin();
        if (parsed.rewards) {
          invalidate.setPointsSummary({
            balance: parsed.rewards.balance,
            level: parsed.rewards.level,
            levelLabel: parsed.rewards.level,
            lifetimePoints: parsed.rewards.balance,
            pointsToNextLevel: 0,
            nextLevel: null,
          });
        }
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi mount
  }, []);

  useEffect(() => {
    if (!result?.checkin.upgradeExpiresAt) return;
    const tick = () => {
      const ms = new Date(result.checkin.upgradeExpiresAt).getTime() - Date.now();
      setRemainingMs(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [result]);

  const checkin = result?.checkin;
  const rewards = result?.rewards;

  return (
    <div className="space-y-6 text-center">
      <div className="tp-success-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
        ✓
      </div>

      <header>
        <h1 className="tp-page-title">Check-in thành công!</h1>
        {checkin && <p className="tp-page-subtitle mt-2">{checkin.siteName}</p>}
      </header>

      {rewards && (
        <div className="tp-card">
          <p className="text-3xl font-semibold text-primary">+{rewards.pointsDelta} điểm</p>
          <p className="mt-2 text-sm text-muted">
            Tổng lần này: {rewards.pointsAwarded} · Level {rewards.level} · Số dư{' '}
            {rewards.balance}
          </p>
          <p className="mt-1 text-xs text-muted">Proof: {checkin?.proofLevel}</p>
          {rewards.badgesUnlocked.length > 0 && (
            <div className="mt-4 space-y-2 text-left">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-muted">
                Badge mới
              </p>
              {rewards.badgesUnlocked.map((b) => (
                <BadgeCard
                  key={b.id}
                  badge={{
                    id: b.id,
                    slug: b.slug,
                    name: b.name,
                    earned: true,
                    progressLabel: 'Vừa mở khóa',
                  }}
                  size="sm"
                  layout="row"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {checkin && remainingMs > 0 && (checkin.canAddEvidence.qr || checkin.canAddEvidence.photo) && (
        <div className="rounded-2xl border border-border bg-surface p-4 text-left">
          <p className="text-sm font-semibold text-gray-900">
            Tăng thêm điểm (tuỳ chọn)
          </p>
          <p className="mt-1 text-xs text-muted">
            Còn {formatCountdown(remainingMs)} để bổ sung bằng chứng
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {checkin.canAddEvidence.photo && checkinId && (
              <Link
                href={`/check-ins/${checkinId}/upgrade?type=photo`}
                className="tp-btn tp-btn-primary w-full text-sm"
              >
                📷 Chụp ảnh tại chỗ (+15 điểm)
              </Link>
            )}
            {checkin.canAddEvidence.qr && checkinId && (
              <Link
                href={`/check-in/scan?checkinId=${checkinId}`}
                className="tp-btn tp-btn-secondary w-full text-sm"
              >
                Quét QR tại quầy (nếu có)
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Link href="/passport" className="tp-btn tp-btn-primary">
          Xem Passport
        </Link>
        <Link href="/sites" className="tp-link text-sm">
          Khám phá thêm điểm
        </Link>
      </div>
    </div>
  );
}
