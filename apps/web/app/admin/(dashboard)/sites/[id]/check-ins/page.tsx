'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useInfiniteScroll } from '@/app/_hooks/use-infinite-scroll';
import { AdminCheckInRow, fetchSiteCheckInsPage } from '@/app/admin/_lib/check-ins';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN');
}

export default function SiteCheckInsPage() {
  const params = useParams<{ id: string }>();
  const fetchPage = useCallback(
    (page: number) => fetchSiteCheckInsPage(params.id, page),
    [params.id],
  );
  const { items, loading, loadingMore, hasMore, error, sentinelRef, total } =
    useInfiniteScroll<AdminCheckInRow>({ fetchPage, resetKey: params.id });

  return (
    <div className="space-y-6">
      <Link href={`/admin/sites/${params.id}`} className="text-sm text-admin hover:underline">
        ← Site
      </Link>
      <h1 className="text-2xl font-semibold">Check-ins</h1>

      {error && <p className="tp-alert-error">{error}</p>}

      {items.length === 0 && !loading && !error && (
        <div className="tp-card text-center text-muted">Chưa có check-in</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">Điểm</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{formatDate(r.checkedInAt)}</td>
                <td className="px-4 py-3">{r.userPhoneMasked ?? '—'}</td>
                <td className="px-4 py-3">
                  {r.proofLevel}
                  {r.evidenceFlags.length > 0 && ` (${r.evidenceFlags.join(', ')})`}
                </td>
                <td className="px-4 py-3">{r.pointsAwarded}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/check-ins/${r.id}`} className="text-admin hover:underline">
                    {r.status}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
