'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchVouchers, MerchantVoucher } from '@/app/merchant/_lib/portal';

export default function MerchantVouchersPage() {
  const [rows, setRows] = useState<MerchantVoucher[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers()
      .then(setRows)
      .catch(() => setError('Không tải được vouchers.'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ưu đãi</h1>
        <Link href="/merchant/vouchers/new" className="tp-btn tp-btn-primary">
          + Tạo
        </Link>
      </div>

      {error && <p className="tp-alert-error">{error}</p>}
      {rows.length === 0 && !error && (
        <div className="tp-card text-center text-muted">Tạo ưu đãi đầu tiên</div>
      )}

      <ul className="space-y-3">
        {rows.map((v) => (
          <li key={v.id}>
            <Link href={`/merchant/vouchers/${v.id}`} className="tp-card block hover:shadow-md">
              <p className="font-medium">{v.title}</p>
              <p className="text-sm text-merchant">{v.discountLabel}</p>
              <p className="text-xs text-muted capitalize">{v.status}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
