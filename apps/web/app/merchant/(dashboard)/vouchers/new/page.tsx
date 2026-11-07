'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/merchant/_lib/api';
import { getErrorMessage } from '@/app/merchant/_lib/errors';
import { createVoucher } from '@/app/merchant/_lib/portal';

export default function MerchantVoucherNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const voucher = await createVoucher({
        title: String(fd.get('title')),
        description: String(fd.get('description') || '') || undefined,
        discountLabel: String(fd.get('discountLabel')),
        minLevel: String(fd.get('minLevel')),
        costPoints: Number(fd.get('costPoints') || 0),
        validFrom: `${fd.get('validFrom')}T00:00:00.000Z`,
        validUntil: `${fd.get('validUntil')}T23:59:59.000Z`,
      });
      router.push(`/merchant/vouchers/${voucher.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Tạo voucher thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/merchant/vouchers" className="text-sm text-merchant hover:underline">
        ← Vouchers
      </Link>
      <h1 className="text-2xl font-semibold">Tạo voucher</h1>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block text-sm">
          Tiêu đề *
          <input name="title" className="tp-input mt-1 w-full" required />
        </label>
        <label className="block text-sm">
          Nhãn giảm giá *
          <input name="discountLabel" className="tp-input mt-1 w-full" placeholder="15% OFF" required />
        </label>
        <label className="block text-sm">
          Mô tả
          <textarea name="description" className="tp-input mt-1 w-full" rows={2} />
        </label>
        <label className="block text-sm">
          Level tối thiểu
          <select name="minLevel" className="tp-input mt-1 w-full" defaultValue="TRAVELLER">
            <option value="TRAVELLER">TRAVELLER</option>
            <option value="EXPLORER">EXPLORER</option>
            <option value="LOCAL_INSIDER">LOCAL_INSIDER</option>
          </select>
        </label>
        <label className="block text-sm">
          Cost points (0 = free)
          <input name="costPoints" type="number" min={0} className="tp-input mt-1 w-full" defaultValue={0} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Từ *
            <input name="validFrom" type="date" className="tp-input mt-1 w-full" defaultValue={today} required />
          </label>
          <label className="block text-sm">
            Đến *
            <input name="validUntil" type="date" className="tp-input mt-1 w-full" defaultValue={nextMonth} required />
          </label>
        </div>
        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
          {loading ? 'Đang tạo…' : 'Lưu draft'}
        </button>
      </form>
    </div>
  );
}
