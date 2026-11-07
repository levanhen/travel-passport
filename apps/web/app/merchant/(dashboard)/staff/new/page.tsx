'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ApiRequestError } from '@/app/merchant/_lib/api';
import { getErrorMessage } from '@/app/merchant/_lib/errors';
import { createStaff } from '@/app/merchant/_lib/portal';

export default function MerchantStaffNewPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      await createStaff(String(fd.get('email')), String(fd.get('password')));
      setDone(true);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Thêm staff thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link href="/merchant/staff" className="text-sm text-merchant hover:underline">
        ← Staff
      </Link>
      <h1 className="text-2xl font-semibold">Thêm staff</h1>
      {done ? (
        <div className="tp-card text-center">
          <p>Đã tạo nhân viên.</p>
          <Link href="/merchant/staff" className="tp-link mt-2 inline-block text-sm">
            Về danh sách
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="tp-card space-y-4">
          <label className="block text-sm">
            Email *
            <input name="email" type="email" className="tp-input mt-1 w-full" required />
          </label>
          <label className="block text-sm">
            Password *
            <input name="password" type="password" minLength={8} className="tp-input mt-1 w-full" required />
          </label>
          {error && <p className="tp-alert-error">{error}</p>}
          <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
            {loading ? 'Đang tạo…' : 'Tạo staff'}
          </button>
        </form>
      )}
    </div>
  );
}
