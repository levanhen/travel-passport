'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/toast';
import { InfiniteScrollFooter } from '@/app/_components/infinite-scroll-footer';
import { useClientInfiniteList } from '@/app/_hooks/use-client-infinite-list';
import { SkeletonListRow } from '@/app/_components/skeleton';
import {
  ApiRequestError,
  claimVoucher,
} from '@/app/(tourist)/_lib/vouchers';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { useAvailableVouchers, useInvalidateTouristData, usePilotDestination } from '@/app/(tourist)/_lib/queries';

export default function VouchersPage() {
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidateTouristData();
  const [claiming, setClaiming] = useState<string | null>(null);

  const { data: dest, isLoading: destLoading } = usePilotDestination();
  const { data: vouchers = [], isLoading: vouchersLoading } = useAvailableVouchers(dest?.id);

  const loading = destLoading || vouchersLoading;
  const { visible: visibleVouchers, hasMore, sentinelRef } = useClientInfiniteList(vouchers, 10);

  async function onClaim(id: string) {
    setClaiming(id);
    try {
      const result = await claimVoucher(id);
      invalidate.afterVoucherClaim();
      router.push(`/vouchers/claims/${result.claim.id}`);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.showError(getErrorMessage(e.code, e.message));
      } else {
        toast.showError(getErrorMessage('UNKNOWN'));
      }
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-orange-600">Đối tác địa phương</p>
        <h1 className="tp-page-title mt-1">Ưu đãi</h1>
        <p className="tp-page-subtitle mt-1">Đổi điểm lấy voucher tại quán</p>
      </header>

      <Link
        href="/vouchers/claims"
        className="tp-card-interactive block bg-gradient-to-r from-orange-50 to-amber-50 p-3 text-center text-sm font-medium text-orange-900"
      >
        Voucher đã claim →
      </Link>

      {loading && vouchers.length === 0 && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonListRow key={i} />
          ))}
        </div>
      )}

      <ul className="space-y-4">
        {visibleVouchers.map((v) => (
          <li
            key={v.id}
            className="tp-card overflow-hidden border-orange-100/80 bg-gradient-to-br from-white to-orange-50/30 p-0"
          >
            <div className="border-b border-orange-100/60 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2">
              <p className="text-lg font-bold text-white">{v.discountLabel}</p>
            </div>
            <div className="p-4">
              <p className="font-semibold text-gray-900">{v.title}</p>
              <p className="text-sm text-muted">{v.merchantName}</p>
              <p className="mt-2 text-xs text-muted">
                {v.costPoints > 0 ? `${v.costPoints} điểm` : 'Miễn phí'} · Level {v.minLevel}
              </p>
              <button
                type="button"
                className="tp-btn tp-btn-primary mt-3 w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={claiming === v.id || !v.canClaim}
                onClick={() => onClaim(v.id)}
              >
                {claiming === v.id ? 'Đang claim…' : v.canClaim ? 'Claim voucher' : 'Chưa đủ điều kiện'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && vouchers.length === 0 && (
        <p className="text-muted">Chưa có ưu đãi phù hợp — tích thêm điểm hoặc nâng level.</p>
      )}

      <InfiniteScrollFooter sentinelRef={sentinelRef} hasMore={hasMore} total={vouchers.length} />
    </div>
  );
}
