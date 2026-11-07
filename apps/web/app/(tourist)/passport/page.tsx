'use client';

import Link from 'next/link';
import { BadgeCard } from '@/app/(tourist)/_components/badge-card';
import { PassportCard } from '@/app/(tourist)/_components/passport-card';
import { SkeletonPassportPage } from '@/app/_components/skeleton';
import { useBadges, usePilotDestination, usePointsSummary } from '@/app/(tourist)/_lib/queries';

export default function PassportPage() {
  const { data: summary, isLoading: pointsLoading, error: pointsError } = usePointsSummary();
  const { data: dest, isLoading: destLoading } = usePilotDestination();
  const { data: badges = [], isLoading: badgesLoading } = useBadges(dest?.id);

  const earnedBadges = badges.filter((b) => b.earned).slice(0, 4);
  const loading = pointsLoading || destLoading;
  const error = pointsError ? 'Không tải được passport.' : null;

  if (loading && !summary) {
    return <SkeletonPassportPage />;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-ocean">Hành trình</p>
        <h1 className="tp-page-title mt-1">Passport</h1>
        <p className="tp-page-subtitle mt-1">Thành tích và điểm tích lũy của bạn</p>
      </header>

      {error && <p className="tp-alert-error">{error}</p>}

      {summary && <PassportCard summary={summary} asLink={false} />}

      {!badgesLoading && earnedBadges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Badge gần đây</h2>
            <Link href="/passport/badges" className="text-xs text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {earnedBadges.map((b) => (
              <li key={b.id}>
                <BadgeCard badge={b} size="sm" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-3">
        <Link href="/passport/check-ins" className="tp-card-interactive block p-4">
          <p className="font-semibold text-gray-900">📍 Lịch sử check-in</p>
          <p className="mt-1 text-sm text-muted">Các điểm bạn đã ghé thăm</p>
        </Link>
        <Link href="/passport/badges" className="tp-card-interactive block p-4">
          <p className="font-semibold text-gray-900">🏅 Huy hiệu</p>
          <p className="mt-1 text-sm text-muted">Bộ sưu tập thành tích pilot</p>
        </Link>
        <Link href="/passport/points" className="tp-card-interactive block p-4">
          <p className="font-semibold text-gray-900">✨ Lịch sử điểm</p>
          <p className="mt-1 text-sm text-muted">Giao dịch tích/trừ điểm</p>
        </Link>
      </div>
    </div>
  );
}
