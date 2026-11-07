'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useInfiniteScroll } from '@/app/_hooks/use-infinite-scroll';
import { fetchMyClaimsPage, VoucherClaim } from '@/app/(tourist)/_lib/vouchers';

export default function VoucherClaimsPage() {
  const fetchPage = useCallback((page: number) => fetchMyClaimsPage(page), []);
  const { items, loading, loadingMore, hasMore, error, sentinelRef, total } =
    useInfiniteScroll<VoucherClaim>({ fetchPage });

  return (
    <div className="space-y-5">
      <Link href="/vouchers" className="tp-link text-sm">
        ← Ưu đãi
      </Link>
      <h1 className="tp-page-title">Voucher của tôi</h1>
      {error && <p className="tp-alert-error">{error}</p>}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="tp-card">
            <p className="font-medium">{c.voucherTitle}</p>
            <p className="text-sm text-muted">{c.merchantName}</p>
            <p className="mt-2 font-mono text-lg">{c.claimCode}</p>
            <p className="mt-1 text-xs text-muted">
              {c.discountLabel} · {c.status}
            </p>
            <Link href={`/vouchers/claims/${c.id}`} className="tp-link mt-2 inline-block text-sm">
              Chi tiết QR
            </Link>
          </li>
        ))}
      </ul>
      {!loading && items.length === 0 && !error && (
        <p className="text-muted">Chưa claim voucher nào.</p>
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
