'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useInfiniteScroll } from '@/app/_hooks/use-infinite-scroll';
import { fetchPointTransactions, PointTransaction } from '@/app/(tourist)/_lib/points';

export default function PointsHistoryPage() {
  const fetchPage = useCallback((page: number) => fetchPointTransactions(page), []);
  const { items, loading, loadingMore, hasMore, error, sentinelRef, total } =
    useInfiniteScroll<PointTransaction>({ fetchPage });

  return (
    <div className="space-y-5">
      <Link href="/passport" className="tp-link text-sm">
        ← Passport
      </Link>
      <h1 className="tp-page-title">Lịch sử điểm</h1>
      {error && <p className="tp-alert-error">{error}</p>}
      <ul className="space-y-2">
        {items.map((tx) => (
          <li key={tx.id} className="tp-card text-sm">
            <div className="flex justify-between gap-2">
              <span>{tx.description ?? tx.type}</span>
              <span className={tx.amount >= 0 ? 'text-primary' : 'text-error'}>
                {tx.amount >= 0 ? '+' : ''}
                {tx.amount}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {new Date(tx.createdAt).toLocaleString('vi-VN')}
            </p>
          </li>
        ))}
      </ul>
      {!loading && items.length === 0 && !error && (
        <p className="text-muted">Chưa có giao dịch điểm.</p>
      )}
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
