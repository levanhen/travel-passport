'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useInfiniteScroll } from '@/app/_hooks/use-infinite-scroll';
import { CheckinListItem, fetchCheckinsPage } from '@/app/(tourist)/_lib/check-in';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PassportCheckInsPage() {
  const fetchPage = useCallback((page: number) => fetchCheckinsPage(page), []);
  const { items, loading, loadingMore, hasMore, error, sentinelRef, total } =
    useInfiniteScroll<CheckinListItem>({ fetchPage });

  return (
    <div className="space-y-6">
      <header>
        <Link href="/passport" className="tp-link text-sm">
          ← Passport
        </Link>
        <h1 className="tp-page-title mt-2">Lịch sử check-in</h1>
      </header>

      {error && <p className="tp-alert-error">{error}</p>}

      {items.length === 0 && !loading && !error && (
        <div className="tp-card text-center text-muted">
          <p>Chưa có check-in nào.</p>
          <Link href="/sites" className="tp-link mt-2 inline-block text-sm">
            Khám phá điểm du lịch
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="tp-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{c.siteName}</p>
                <p className="mt-1 text-sm text-muted">{formatDate(c.checkedInAt)}</p>
                <p className="mt-1 text-xs text-muted">
                  {c.proofLevel} · {c.pointsAwarded} điểm
                  {c.evidenceFlags.length > 0 && ` · ${c.evidenceFlags.join(', ')}`}
                </p>
              </div>
              {c.canAddEvidence.qr || c.canAddEvidence.photo ? (
                <Link
                  href={
                    c.canAddEvidence.qr
                      ? `/check-in/scan?checkinId=${c.id}`
                      : `/check-ins/${c.id}/upgrade?type=photo`
                  }
                  className="tp-btn tp-btn-ghost shrink-0 text-xs"
                >
                  Nâng cấp
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <InfiniteScrollFooter
        sentinelRef={sentinelRef}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        total={total}
      />
    </div>
  );
}
