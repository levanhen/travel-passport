'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminMerchant, fetchMerchants } from '@/app/admin/_lib/merchants';
import { fetchPilotDestination } from '@/app/admin/_lib/sites';

export default function AdminMerchantsPage() {
  const [rows, setRows] = useState<AdminMerchant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPilotDestination()
      .then((dest) => fetchMerchants(dest.id))
      .then(setRows)
      .catch(() => setError('Không tải được merchants.'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Merchants</h1>
        <Link href="/admin/merchants/new" className="tp-btn tp-btn-primary">
          + Onboard
        </Link>
      </div>

      {error && <p className="tp-alert-error">{error}</p>}
      {rows.length === 0 && !error && (
        <div className="tp-card text-center text-muted">Onboard merchant đầu tiên</div>
      )}

      <ul className="space-y-3">
        {rows.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/merchants/${m.id}`} className="tp-card block hover:shadow-md">
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-muted capitalize">
                {m.category} · {m.status}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
