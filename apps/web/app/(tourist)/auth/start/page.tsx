'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/app/(tourist)/_components/auth-shell';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { touristStartRaw } from '@/app/(tourist)/_lib/auth';

export default function AuthStartPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('090');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await touristStartRaw(phone);
      if (result.kind === 'session') {
        router.replace('/');
        return;
      }
      if (result.kind === 'set_pin') {
        router.push(`/auth/set-pin?phone=${encodeURIComponent(phone)}`);
        return;
      }
      if (result.kind === 'unlock') {
        router.push(`/auth/unlock?phone=${encodeURIComponent(phone)}`);
        return;
      }
      setError(getErrorMessage(result.code, result.message));
    } catch {
      setError(getErrorMessage('UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      step="phone"
      title="Bắt đầu hành trình"
      subtitle="Nhập số điện thoại Việt Nam để tạo hoặc mở Passport du lịch."
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="block">
          <span className="tp-label">Số điện thoại</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
              +84
            </span>
            <input
              type="tel"
              className="tp-auth-phone-input pl-12"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="901234567"
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">Ví dụ: 0901234567 hoặc 901234567</p>
        </label>
        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
          {loading ? 'Đang xử lý…' : 'Tiếp tục'}
        </button>
      </form>
    </AuthShell>
  );
}
