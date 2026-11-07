'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDashboard, MerchantDashboard } from '@/app/merchant/_lib/portal';

export default function MerchantDashboardPage() {
  const [data, setData] = useState<MerchantDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError('Không tải được dashboard.'));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </header>

      {error && <p className="tp-alert-error">{error}</p>}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="tp-card">
            <p className="text-sm text-muted">Redeem hôm nay</p>
            <p className="mt-1 text-3xl font-semibold text-merchant">{data.redemptionsToday}</p>
          </div>
          <div className="tp-card">
            <p className="text-sm text-muted">Voucher đang phát</p>
            <p className="mt-1 text-3xl font-semibold text-merchant">{data.activeVouchers}</p>
          </div>
          <div className="tp-card">
            <p className="text-sm text-muted">Tổng claim</p>
            <p className="mt-1 text-2xl font-semibold">{data.totalClaims}</p>
          </div>
          <div className="tp-card">
            <p className="text-sm text-muted">Tổng redeem</p>
            <p className="mt-1 text-2xl font-semibold">{data.totalRedemptions}</p>
          </div>
        </div>
      )}

      <Link href="/merchant/redeem" className="tp-btn tp-btn-primary block text-center">
        Quét voucher
      </Link>
    </div>
  );
}
