'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/merchant/_lib/api';
import { getErrorMessage } from '@/app/merchant/_lib/errors';
import { fetchVoucher, patchVoucher } from '@/app/merchant/_lib/portal';

export default function MerchantVoucherEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVoucher(params.id)
      .then((v) => {
        setTitle(v.title);
        setDescription(v.description ?? '');
      })
      .catch(() => setError('Không tải được voucher.'));
  }, [params.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await patchVoucher(params.id, { title, description });
      router.push(`/merchant/vouchers/${params.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Lưu thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href={`/merchant/vouchers/${params.id}`} className="text-sm text-merchant hover:underline">
        ← Chi tiết
      </Link>
      <h1 className="text-2xl font-semibold">Sửa voucher</h1>
      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block text-sm">
          Tiêu đề
          <input className="tp-input mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block text-sm">
          Mô tả
          <textarea
            className="tp-input mt-1 w-full"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
          {loading ? 'Đang lưu…' : 'Lưu'}
        </button>
      </form>
    </div>
  );
}
