'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMe, logout } from '@/app/(tourist)/_lib/auth';
import { fetchProfile, TouristProfile } from '@/app/(tourist)/_lib/profile';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TouristProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => {
        if (!me) {
          router.replace('/auth/start');
          return;
        }
        return fetchProfile().then(setProfile);
      })
      .catch(() => setError('Không tải được hồ sơ.'));
  }, [router]);

  async function onLogout() {
    await logout();
    router.replace('/auth/start');
  }

  if (error) return <p className="tp-alert-error">{error}</p>;
  if (!profile) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="tp-page-title">Hồ sơ</h1>
      </header>

      <div className="tp-card space-y-2">
        <p className="text-sm text-muted">Tên hiển thị</p>
        <p className="font-medium">{profile.displayName}</p>
        <p className="text-sm text-muted">Số điện thoại</p>
        <p className="font-medium">{profile.phoneMasked ?? '—'}</p>
        {!profile.phoneVerified && (
          <p className="text-xs text-amber-700">Chưa xác minh SIM</p>
        )}
        <p className="text-sm text-muted">Cấp độ & điểm</p>
        <p className="font-medium">
          {profile.levelLabel} · {profile.pointsBalance.toLocaleString('vi-VN')} điểm
        </p>
        <Link href="/passport/points" className="text-sm text-primary hover:underline">
          Xem chi tiết điểm →
        </Link>
      </div>

      <div className="grid gap-3">
        <Link href="/profile/edit" className="tp-card block text-sm font-medium">
          Sửa profile
        </Link>
        <Link href="/profile/change-pin" className="tp-card block text-sm font-medium">
          Đổi PIN
        </Link>
        <Link href="/legal/terms" className="tp-card block text-sm font-medium">
          Điều khoản
        </Link>
        <Link href="/legal/privacy" className="tp-card block text-sm font-medium">
          Quyền riêng tư
        </Link>
      </div>

      <button type="button" className="tp-btn tp-btn-ghost w-full" onClick={onLogout}>
        Đăng xuất
      </button>
    </div>
  );
}
