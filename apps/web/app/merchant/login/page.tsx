'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError, clearSession, staffLogin } from '@/app/merchant/_lib/auth';
import { getErrorMessage, isMerchantRole } from '@/app/merchant/_lib/errors';

export default function MerchantLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await staffLogin(email, password);
      if (!isMerchantRole(session.user.role)) {
        clearSession();
        setError('Tài khoản không có quyền truy cập Merchant Portal.');
        return;
      }
      const dest =
        session.user.role === 'merchant_staff' ? '/merchant/redeem' : '/merchant';
      router.replace(dest);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(getErrorMessage(err.code, err.message));
      } else {
        setError(getErrorMessage('UNKNOWN'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <main className="tp-auth-shell">
        <div className="tp-card">
          <h1 className="tp-page-title">Merchant Portal</h1>
          <p className="tp-page-subtitle mt-1">Đăng nhập bằng email và mật khẩu</p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <label className="block">
              <span className="tp-label">Email</span>
              <input
                type="email"
                className="tp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="block">
              <span className="tp-label">Mật khẩu</span>
              <input
                type="password"
                className="tp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={8}
                required
              />
            </label>
            {error && <p className="tp-alert-error">{error}</p>}
            <button type="submit" className="tp-btn tp-btn-merchant w-full" disabled={loading}>
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-muted">
            <Link href="/legal/terms" className="tp-link">
              Điều khoản
            </Link>
            {' · '}
            <Link href="/legal/privacy" className="tp-link">
              Quyền riêng tư
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
