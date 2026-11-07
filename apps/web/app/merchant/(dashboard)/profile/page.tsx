'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiRequestError } from '@/app/merchant/_lib/api';
import { fetchBusiness, MerchantBusiness, patchBusiness } from '@/app/merchant/_lib/portal';
import { getErrorMessage } from '@/app/merchant/_lib/errors';

export default function MerchantProfilePage() {
  const [business, setBusiness] = useState<MerchantBusiness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchBusiness()
      .then(setBusiness)
      .catch(() => setError('Không tải được hồ sơ quán.'));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await patchBusiness({
        name: String(fd.get('name')),
        address: String(fd.get('address') || '') || undefined,
        contactPhone: String(fd.get('contactPhone') || '') || undefined,
      });
      setBusiness(updated);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Lưu thất bại (cần quyền owner).');
    } finally {
      setLoading(false);
    }
  }

  if (!business && !error) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Hồ sơ quán</h1>
      {business && (
        <form onSubmit={onSubmit} className="tp-card space-y-4">
          <p className="text-sm text-muted">{business.destinationName}</p>
          <label className="block text-sm">
            Tên quán
            <input name="name" className="tp-input mt-1 w-full" defaultValue={business.name} />
          </label>
          <label className="block text-sm">
            Địa chỉ
            <input name="address" className="tp-input mt-1 w-full" defaultValue={business.address ?? ''} />
          </label>
          <label className="block text-sm">
            SĐT liên hệ
            <input name="contactPhone" className="tp-input mt-1 w-full" defaultValue={business.contactPhone ?? ''} />
          </label>
          {saved && <p className="text-sm text-green-700">Đã lưu.</p>}
          {error && <p className="tp-alert-error">{error}</p>}
          <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
            {loading ? 'Đang lưu…' : 'Lưu'}
          </button>
        </form>
      )}
      <Link href="/merchant/settings" className="tp-link text-sm">
        Cài đặt tài khoản →
      </Link>
    </div>
  );
}
