'use client';

import { useMemo, useState } from 'react';
import { SkeletonSitesPage } from '@/app/_components/skeleton';
import {
  categoryLabel,
  SITE_CATEGORIES,
} from '@/app/(tourist)/_lib/sites';
import { useDestinationSites, usePilotDestination } from '@/app/(tourist)/_lib/queries';
import { SiteCard } from '@/app/(tourist)/_components/site-card';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useClientInfiniteList } from '@/app/_hooks/use-client-infinite-list';

export default function SitesPage() {
  const [category, setCategory] = useState<string | null>(null);
  const { data: dest, isLoading: destLoading, error: destError } = usePilotDestination();
  const {
    data: allSites = [],
    isLoading: sitesLoading,
    error: sitesError,
  } = useDestinationSites(dest?.id);

  const loading = destLoading || sitesLoading;
  const error = destError || sitesError;

  const visibleCategories = useMemo(() => {
    const used = new Set(allSites.map((s) => s.category));
    return SITE_CATEGORIES.filter((c) => used.has(c));
  }, [allSites]);

  const sites = useMemo(
    () => (category ? allSites.filter((s) => s.category === category) : allSites),
    [allSites, category],
  );

  const { visible: visibleSites, hasMore, sentinelRef } = useClientInfiniteList(sites, 12);

  if (loading && allSites.length === 0) {
    return <SkeletonSitesPage />;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-ocean">Điểm du lịch</p>
        <h1 className="tp-page-title mt-1">{dest?.name ?? 'Đà Nẵng'}</h1>
        <p className="tp-page-subtitle mt-1">{allSites.length} điểm check-in</p>
      </header>

      {!loading && visibleCategories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`tp-chip tp-pressable ${category === null ? 'tp-chip-active' : 'tp-chip-inactive'}`}
          >
            Tất cả
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`tp-chip tp-pressable ${category === cat ? 'tp-chip-active' : 'tp-chip-inactive'}`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="tp-alert-error">Không tải được danh sách điểm. Kiểm tra API và seed dữ liệu pilot.</p>
      )}

      {!loading && !error && sites.length === 0 && (
        <p className="text-muted">Chưa có điểm nào trong khu vực pilot.</p>
      )}

      <ul className="space-y-4">
        {visibleSites.map((site) => (
          <li key={site.id}>
            <SiteCard site={site} />
          </li>
        ))}
      </ul>

      <InfiniteScrollFooter sentinelRef={sentinelRef} hasMore={hasMore} total={sites.length} />
    </div>
  );
}
