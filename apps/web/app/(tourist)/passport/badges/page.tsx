'use client';

import Link from 'next/link';
import { BadgeCard } from '@/app/(tourist)/_components/badge-card';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useClientInfiniteList } from '@/app/_hooks/use-client-infinite-list';
import { SkeletonPassportPage } from '@/app/_components/skeleton';
import { useBadges, usePilotDestination } from '@/app/(tourist)/_lib/queries';

export default function BadgesPage() {
  const { data: dest, isLoading: destLoading } = usePilotDestination();
  const { data: badges = [], isLoading: badgesLoading } = useBadges(dest?.id);

  const loading = destLoading || badgesLoading;
  const earnedCount = badges.filter((b) => b.earned).length;
  const { visible: visibleBadges, hasMore, sentinelRef } = useClientInfiniteList(badges, 12);

  if (loading && badges.length === 0) {
    return <SkeletonPassportPage />;
  }

  return (
    <div className="space-y-5">
      <Link href="/passport" className="tp-link text-sm">
        ← Passport
      </Link>
      <header>
        <h1 className="tp-page-title">Huy hiệu</h1>
        <p className="tp-page-subtitle mt-1">
          {earnedCount}/{badges.length} badge đã mở khóa
        </p>
      </header>

      {!loading && badges.length === 0 && (
        <p className="text-muted">Chưa có badge nào trong pilot.</p>
      )}

      <ul className="grid grid-cols-2 gap-3">
        {visibleBadges.map((b) => (
          <li key={b.id}>
            <BadgeCard badge={b} />
          </li>
        ))}
      </ul>

      <InfiniteScrollFooter sentinelRef={sentinelRef} hasMore={hasMore} total={badges.length} />
    </div>
  );
}
