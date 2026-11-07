'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { hasMorePages, PageMeta, PagedResult } from '@/app/_lib/pagination';

export function useInfiniteScroll<T>({
  fetchPage,
  resetKey,
}: {
  fetchPage: (page: number) => Promise<PagedResult<T>>;
  resetKey?: string | number | boolean | null;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const hasMore = meta ? hasMorePages(meta) : false;

  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await fetchPage(targetPage);
        setMeta(res.meta);
        setPage(targetPage);
        setItems((prev) => (append ? [...prev, ...res.data] : res.data));
        setError(null);
      } catch {
        setError('Không tải được dữ liệu.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        busyRef.current = false;
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    setItems([]);
    setPage(1);
    setMeta(null);
    loadPage(1, false);
  }, [resetKey, loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !busyRef.current) {
          loadPage(page + 1, true);
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, loadPage]);

  return { items, loading, loadingMore, hasMore, error, sentinelRef, total: meta?.total ?? 0 };
}
