'use client';

import { FormEvent, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, maskPhone } from '@/app/(tourist)/_components/auth-shell';
import { PinInput } from '@/app/(tourist)/_components/pin-input';
import { ApiRequestError } from '@/app/(tourist)/_lib/api';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { getStoredPhone, touristUnlock } from '@/app/(tourist)/_lib/auth';

function UnlockForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = useMemo(
    () => params.get('phone') ?? getStoredPhone() ?? '',
    [params],
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone) {
      setError('Thiếu số điện thoại. Quay lại bước trước.');
      return;
    }
    setLoading(true);
    try {
      await touristUnlock(phone, pin);
      router.replace('/');
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
    <AuthShell
      step="pin"
      title="Xác nhận PIN"
      subtitle={`Máy mới · ${maskPhone(phone)}`}
      backHref="/auth/start"
      backLabel="Đổi số điện thoại"
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Bạn đang đăng nhập trên thiết bị mới. Nhập PIN để liên kết máy này với Passport.
        </p>
        <PinInput
          label="PIN 6 số"
          value={pin}
          onChange={setPin}
          autoFocus
          disabled={loading}
        />
        {error && <p className="tp-alert-error">{error}</p>}
        <button
          type="submit"
          className="tp-btn tp-btn-primary w-full"
          disabled={loading || pin.length !== 6}
        >
          {loading ? 'Đang xác nhận…' : 'Đăng nhập'}
        </button>
        <p className="text-center text-xs text-muted">
          Quên PIN? Liên hệ hỗ trợ (MVP chưa có SMS).
        </p>
      </form>
    </AuthShell>
  );
}

export default function AuthUnlockPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Xác nhận PIN" subtitle="Đang tải…">
          <p className="text-muted">Đang tải…</p>
        </AuthShell>
      }
    >
      <UnlockForm />
    </Suspense>
  );
}
