'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type RedeemResult = {
  redemptionId: string;
  claimCode: string;
  voucherTitle: string;
  redeemedAt: string;
};

export default function MerchantRedeemSuccessPage() {
  const [result, setResult] = useState<RedeemResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('tp_redeem_result');
    if (raw) {
      try {
        setResult(JSON.parse(raw) as RedeemResult);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return (
    <div className="space-y-6 text-center">
      <div className="tp-card mx-auto max-w-sm">
        <p className="text-4xl">✓</p>
        <h1 className="mt-2 text-xl font-semibold">Redeem thành công</h1>
        {result && (
          <div className="mt-4 space-y-1 text-sm text-muted">
            <p>{result.voucherTitle}</p>
            <p className="font-mono">{result.claimCode}</p>
            <p>{new Date(result.redeemedAt).toLocaleString('vi-VN')}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/merchant/redeem" className="tp-btn tp-btn-primary">
          Quét voucher khác
        </Link>
        <Link href="/merchant" className="tp-link text-sm">
          Về dashboard
        </Link>
      </div>
    </div>
  );
}
