'use client';

import { FormEvent, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, maskPhone } from '@/app/(tourist)/_components/auth-shell';
import { ConsentCheckbox } from '@/app/(tourist)/_components/consent-checkbox';
import { PinInput } from '@/app/(tourist)/_components/pin-input';
import { ApiRequestError } from '@/app/(tourist)/_lib/api';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { getStoredPhone, touristSetPin } from '@/app/(tourist)/_lib/auth';

function SetPinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = useMemo(
    () => params.get('phone') ?? getStoredPhone() ?? '',
    [params],
  );
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinsMatch = pin.length === 6 && pin === pin2;
  const canSubmit = pinsMatch && consent && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone) {
      setError('Thiếu số điện thoại. Quay lại bước trước.');
      return;
    }
    if (pin !== pin2) {
      setError('Hai lần nhập PIN không khớp.');
      return;
    }
    if (!consent) {
      setError(getErrorMessage('CONSENT_REQUIRED'));
      return;
    }
    setLoading(true);
    try {
      await touristSetPin(phone, pin);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === 'AUTH_PHONE_TAKEN') {
          router.push(`/auth/unlock?phone=${encodeURIComponent(phone)}`);
          return;
        }
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
      title="Đặt mã PIN"
      subtitle={`Tài khoản mới · ${maskPhone(phone)}`}
      backHref="/auth/start"
      backLabel="Đổi số điện thoại"
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <PinInput
          label="PIN 6 số"
          value={pin}
          onChange={setPin}
          autoFocus
          disabled={loading}
        />
        <PinInput
          label="Nhập lại PIN"
          value={pin2}
          onChange={setPin2}
          disabled={loading}
        />
        {pin.length === 6 && pin2.length === 6 && !pinsMatch && (
          <p className="text-center text-xs text-amber-700">Hai lần nhập PIN chưa khớp.</p>
        )}
        <ConsentCheckbox checked={consent} onChange={setConsent} disabled={loading} />
        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={!canSubmit}>
          {loading ? 'Đang tạo Passport…' : 'Hoàn tất đăng ký'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function AuthSetPinPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Đặt mã PIN" subtitle="Đang tải…">
          <p className="text-muted">Đang tải…</p>
        </AuthShell>
      }
    >
      <SetPinForm />
    </Suspense>
  );
}
