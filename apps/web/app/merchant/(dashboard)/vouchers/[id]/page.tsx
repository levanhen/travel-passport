'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ApiRequestError } from '@/app/merchant/_lib/api';
import { getErrorMessage } from '@/app/merchant/_lib/errors';
import { fetchVoucher, MerchantVoucher, patchVoucher } from '@/app/merchant/_lib/portal';

export default function MerchantVoucherDetailPage() {
  const params = useParams<{ id: string }>();
  const [voucher, setVoucher] = useState<MerchantVoucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVoucher(params.id)
      .then(setVoucher)
      .catch(() => setError('Không tải được voucher.'));
  }, [params.id]);

  async function publish() {
    if (!voucher) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await patchVoucher(voucher.id, { status: 'issued' });
      setVoucher(updated);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Publish thất bại.');
    } finally {
      setLoading(false);
    }
  }

  if (!voucher && !error) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/merchant/vouchers" className="text-sm text-merchant hover:underline">
        ← Vouchers
      </Link>

      {voucher && (
        <>
          <header>
            <h1 className="text-2xl font-semibold">{voucher.title}</h1>
            <p className="mt-1 text-lg text-merchant">{voucher.discountLabel}</p>
            <p className="text-sm capitalize text-muted">{voucher.status}</p>
          </header>
          <div className="tp-card text-sm space-y-2">
            {voucher.description && <p>{voucher.description}</p>}
            <p>Min level: {voucher.minLevel}</p>
            <p>Cost: {voucher.costPoints} điểm</p>
            <p>
              Hiệu lực: {new Date(voucher.validFrom).toLocaleDateString('vi-VN')} –{' '}
              {new Date(voucher.validUntil).toLocaleDateString('vi-VN')}
            </p>
            {voucher.redemptionsCount != null && <p>Redemptions: {voucher.redemptionsCount}</p>}
          </div>
          {voucher.status === 'draft' && (
            <button type="button" className="tp-btn tp-btn-primary w-full" onClick={publish} disabled={loading}>
              {loading ? 'Đang publish…' : 'Publish voucher'}
            </button>
          )}
          <Link href={`/merchant/vouchers/${voucher.id}/edit`} className="tp-btn tp-btn-secondary block text-center">
            Sửa
          </Link>
        </>
      )}
      {error && <p className="tp-alert-error">{error}</p>}
    </div>
  );
}
