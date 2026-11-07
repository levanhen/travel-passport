'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ApiRequestError } from '@/app/admin/_lib/api';
import { AdminMerchant, fetchMerchants, patchMerchant } from '@/app/admin/_lib/merchants';
import { fetchPilotDestination } from '@/app/admin/_lib/sites';
import { getErrorMessage } from '@/app/admin/_lib/errors';

export default function AdminMerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<AdminMerchant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPilotDestination()
      .then((dest) => fetchMerchants(dest.id))
      .then((rows) => setMerchant(rows.find((m) => m.id === params.id) ?? null))
      .catch(() => setError('Không tải được merchant.'));
  }, [params.id]);

  async function toggleSuspend() {
    if (!merchant) return;
    setLoading(true);
    setError(null);
    try {
      const next = merchant.status === 'active' ? 'suspended' : 'active';
      const updated = await patchMerchant(merchant.id, next);
      setMerchant(updated);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Cập nhật thất bại.');
    } finally {
      setLoading(false);
    }
  }

  if (!merchant && !error) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/admin/merchants" className="text-sm text-admin hover:underline">
        ← Merchants
      </Link>

      {merchant && (
        <>
          <header>
            <h1 className="text-2xl font-semibold">{merchant.name}</h1>
            <p className="mt-1 text-sm capitalize text-muted">
              {merchant.category} · {merchant.status}
            </p>
          </header>
          <div className="tp-card text-sm">
            <p>Slug: {merchant.slug}</p>
            {merchant.address && <p className="mt-2">Địa chỉ: {merchant.address}</p>}
          </div>
          <button
            type="button"
            className="tp-btn tp-btn-secondary w-full"
            onClick={toggleSuspend}
            disabled={loading}
          >
            {merchant.status === 'active' ? 'Suspend merchant' : 'Kích hoạt lại'}
          </button>
        </>
      )}
      {error && <p className="tp-alert-error">{error}</p>}
    </div>
  );
}
