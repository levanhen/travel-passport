'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/(tourist)/_lib/api';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { changePin } from '@/app/(tourist)/_lib/profile';
import { useToast } from '@/app/_components/toast';

export default function ProfileChangePinPage() {
  const router = useRouter();
  const toast = useToast();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function pinInput(setter: (v: string) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value.replace(/\D/g, '').slice(0, 6));
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPin !== newPin2) {
      setError('Hai lần nhập PIN mới không khớp.');
      return;
    }
    if (oldPin === newPin) {
      setError('PIN mới phải khác PIN hiện tại.');
      return;
    }
    setLoading(true);
    try {
      await changePin(oldPin, newPin);
      toast.showSuccess('Đã đổi PIN.');
      router.push('/profile');
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
    <div className="space-y-6">
      <header>
        <Link href="/profile" className="text-sm text-primary hover:underline">
          ← Hồ sơ
        </Link>
        <h1 className="tp-page-title mt-2">Đổi PIN</h1>
        <p className="tp-page-subtitle mt-1">PIN 6 số dùng khi đăng nhập trên máy mới.</p>
      </header>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block text-sm">
          PIN hiện tại *
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            className="tp-input mt-1 w-full font-mono tracking-widest"
            value={oldPin}
            onChange={pinInput(setOldPin)}
            required
            autoComplete="current-password"
          />
        </label>
        <label className="block text-sm">
          PIN mới *
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            className="tp-input mt-1 w-full font-mono tracking-widest"
            value={newPin}
            onChange={pinInput(setNewPin)}
            required
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm">
          Nhập lại PIN mới *
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            className="tp-input mt-1 w-full font-mono tracking-widest"
            value={newPin2}
            onChange={pinInput(setNewPin2)}
            required
            autoComplete="new-password"
          />
        </label>
        {error && <p className="tp-alert-error">{error}</p>}
        <button
          type="submit"
          className="tp-btn tp-btn-primary w-full"
          disabled={loading || oldPin.length !== 6 || newPin.length !== 6 || newPin2.length !== 6}
        >
          {loading ? 'Đang lưu…' : 'Đổi PIN'}
        </button>
      </form>

      <p className="text-sm text-muted">Quên PIN? Liên hệ hỗ trợ (MVP chưa có SMS).</p>
    </div>
  );
}
