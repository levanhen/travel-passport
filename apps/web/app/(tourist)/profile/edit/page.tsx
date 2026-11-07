'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/(tourist)/_lib/api';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { fetchProfile, updateProfile } from '@/app/(tourist)/_lib/profile';
import { useToast } from '@/app/_components/toast';

export default function ProfileEditPage() {
  const router = useRouter();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        setDisplayName(p.displayName);
        setBio(p.bio ?? '');
      })
      .catch(() => setError('Không tải được hồ sơ.'))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Tên hiển thị không được để trống.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ displayName: trimmedName, bio: bio.trim() });
      toast.showSuccess('Đã cập nhật hồ sơ.');
      router.push('/profile');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(getErrorMessage(err.code, err.message));
      } else {
        setError(getErrorMessage('UNKNOWN'));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/profile" className="text-sm text-primary hover:underline">
          ← Hồ sơ
        </Link>
        <h1 className="tp-page-title mt-2">Sửa profile</h1>
        <p className="tp-page-subtitle mt-1">Tên hiển thị trên passport và voucher.</p>
      </header>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block text-sm">
          Tên hiển thị *
          <input
            name="displayName"
            className="tp-input mt-1 w-full"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            required
          />
        </label>
        <label className="block text-sm">
          Giới thiệu ngắn
          <textarea
            name="bio"
            className="tp-input mt-1 w-full min-h-[88px] resize-y"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            placeholder="Tuỳ chọn"
          />
        </label>
        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
