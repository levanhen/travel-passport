'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/toast';
import { ApiRequestError } from '@/app/merchant/_lib/api';
import { getErrorMessage } from '@/app/merchant/_lib/errors';
import { lookupClaim } from '@/app/merchant/_lib/portal';

export default function MerchantRedeemPage() {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const claimCode = code.trim().toUpperCase();
    if (!claimCode) return;
    setLoading(true);
    try {
      const preview = await lookupClaim(claimCode);
      sessionStorage.setItem('tp_redeem_preview', JSON.stringify(preview));
      router.push(`/merchant/redeem/confirm?code=${encodeURIComponent(claimCode)}`);
    } catch (err) {
      if (err instanceof ApiRequestError) toast.showError(getErrorMessage(err.code, err.message));
      else toast.showError('Không tìm thấy mã claim.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Quét voucher</h1>
        <p className="mt-1 text-sm text-muted">Nhập mã TP-XXXX từ khách (camera scan post-MVP)</p>
      </header>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Mã claim</span>
          <input
            className="tp-input mt-1 w-full font-mono uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TP-XXXX"
            required
          />
        </label>
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
          {loading ? 'Đang tra cứu…' : 'Tra cứu'}
        </button>
      </form>

      <Link href="/merchant/history" className="tp-link block text-center text-sm">
        Xem lịch sử redeem
      </Link>
    </div>
  );
}
