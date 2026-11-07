'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/app/_components/toast';
import { ApiRequestError } from '@/app/merchant/_lib/api';
import { getErrorMessage } from '@/app/merchant/_lib/errors';
import { ClaimLookup, redeemClaim } from '@/app/merchant/_lib/portal';

export default function MerchantRedeemConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const claimCode = searchParams.get('code') ?? '';
  const [preview, setPreview] = useState<ClaimLookup | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('tp_redeem_preview');
    if (raw) {
      try {
        setPreview(JSON.parse(raw) as ClaimLookup);
      } catch {
        /* ignore */
      }
    }
  }, []);

  async function onConfirm() {
    if (!claimCode) return;
    setLoading(true);
    try {
      const result = await redeemClaim(claimCode);
      sessionStorage.setItem('tp_redeem_result', JSON.stringify(result));
      sessionStorage.removeItem('tp_redeem_preview');
      toast.showSuccess('Redeem thành công!');
      router.push('/merchant/redeem/success');
    } catch (err) {
      if (err instanceof ApiRequestError) toast.showError(getErrorMessage(err.code, err.message));
      else toast.showError('Redeem thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/merchant/redeem" className="text-sm text-merchant hover:underline">
        ← Quay lại
      </Link>
      <h1 className="text-2xl font-semibold">Xác nhận redeem</h1>

      {preview && (
        <div className="tp-card space-y-2">
          <p className="font-medium">{preview.voucherTitle}</p>
          <p className="text-lg text-merchant">{preview.discountLabel}</p>
          <p className="font-mono text-sm">{preview.claimCode}</p>
          <p className="text-sm text-muted">
            Hết hạn: {new Date(preview.expiresAt).toLocaleString('vi-VN')}
          </p>
          {!preview.canRedeem && (
            <p className="tp-alert-error">Voucher không thể redeem (hết hạn hoặc đã dùng).</p>
          )}
        </div>
      )}

      <button
        type="button"
        className="tp-btn tp-btn-primary w-full"
        disabled={loading || !preview?.canRedeem}
        onClick={onConfirm}
      >
        {loading ? 'Đang redeem…' : 'Xác nhận dùng voucher'}
      </button>
    </div>
  );
}
