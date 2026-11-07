'use client';

import { useCallback } from 'react';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useInfiniteScroll } from '@/app/_hooks/use-infinite-scroll';
import { fetchRedemptionsPage, RedemptionRow } from '@/app/merchant/_lib/portal';

export default function MerchantHistoryPage() {
  const fetchPage = useCallback((page: number) => fetchRedemptionsPage(page), []);
  const { items, loading, loadingMore, hasMore, error, sentinelRef, total } =
    useInfiniteScroll<RedemptionRow>({ fetchPage });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Lịch sử redeem</h1>
      {error && <p className="tp-alert-error">{error}</p>}
      {items.length === 0 && !loading && !error && (
        <div className="tp-card text-center text-muted">Chưa có lượt redeem</div>
      )}
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="tp-card text-sm">
            <p className="font-medium">{r.voucherTitle}</p>
            <p className="font-mono text-muted">{r.claimCode}</p>
            <p className="text-muted">{new Date(r.redeemedAt).toLocaleString('vi-VN')}</p>
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
