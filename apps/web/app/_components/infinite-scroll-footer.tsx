type InfiniteScrollFooterProps = {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  loadingMore?: boolean;
  hasMore: boolean;
  total: number;
  loading?: boolean;
};

export function InfiniteScrollFooter({
  sentinelRef,
  loadingMore,
  hasMore,
  total,
  loading,
}: InfiniteScrollFooterProps) {
  return (
    <div ref={sentinelRef} className="py-4 text-center text-sm text-muted" aria-live="polite">
      {loading && total === 0 && 'Đang tải…'}
      {loadingMore && 'Đang tải thêm…'}
      {!loading && !loadingMore && !hasMore && total > 0 && 'Đã hiển thị tất cả'}
    </div>
  );
}
