'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/admin/_lib/api';
import { getErrorMessage } from '@/app/admin/_lib/errors';
import { createMerchant } from '@/app/admin/_lib/merchants';
import { fetchPilotDestination } from '@/app/admin/_lib/sites';

export default function AdminMerchantNewPage() {
  const router = useRouter();
  const [destinationId, setDestinationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPilotDestination()
      .then((d) => setDestinationId(d.id))
      .catch(() => setError('Không tải destination.'));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const merchant = await createMerchant({
        organizationName: String(fd.get('organizationName')),
        destinationId,
        merchant: {
          name: String(fd.get('merchantName')),
          slug: String(fd.get('merchantSlug')),
          category: String(fd.get('category')),
          address: String(fd.get('address') || '') || undefined,
        },
        owner: {
          email: String(fd.get('ownerEmail')),
          password: String(fd.get('ownerPassword')),
        },
      });
      router.push(`/admin/merchants/${merchant.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Onboard thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/admin/merchants" className="text-sm text-admin hover:underline">
        ← Merchants
      </Link>
      <h1 className="text-2xl font-semibold">Onboard merchant</h1>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block text-sm">
          Tên tổ chức *
          <input name="organizationName" className="tp-input mt-1 w-full" required />
        </label>
        <label className="block text-sm">
          Tên quán *
          <input name="merchantName" className="tp-input mt-1 w-full" required />
        </label>
        <label className="block text-sm">
          Slug *
          <input name="merchantSlug" className="tp-input mt-1 w-full" pattern="[a-z0-9-]+" required />
        </label>
        <label className="block text-sm">
          Category *
          <select name="category" className="tp-input mt-1 w-full" required>
            <option value="CAFE">CAFE</option>
            <option value="RESTAURANT">RESTAURANT</option>
            <option value="RETAIL">RETAIL</option>
            <option value="OTHER">OTHER</option>
          </select>
        </label>
        <label className="block text-sm">
          Địa chỉ
          <input name="address" className="tp-input mt-1 w-full" />
        </label>
        <hr />
        <label className="block text-sm">
          Owner email *
          <input name="ownerEmail" type="email" className="tp-input mt-1 w-full" required />
        </label>
        <label className="block text-sm">
          Owner password *
          <input name="ownerPassword" type="password" minLength={8} className="tp-input mt-1 w-full" required />
        </label>
        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading || !destinationId}>
          {loading ? 'Đang tạo…' : 'Tạo merchant'}
        </button>
      </form>
    </div>
  );
}
