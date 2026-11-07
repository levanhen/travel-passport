'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchMe, logout, StaffUser } from '@/app/admin/_lib/auth';
import { roleLabel } from '@/app/admin/_lib/errors';
import { useRouter } from 'next/navigation';

export default function AdminProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  async function onLogout() {
    await logout();
    router.replace('/admin/login');
  }

  if (!user) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Staff profile</h1>
      <div className="tp-card space-y-2 text-sm">
        <p>
          <span className="text-muted">Email:</span> {user.email}
        </p>
        <p>
          <span className="text-muted">Role:</span> {roleLabel(user.role)}
        </p>
        <p>
          <span className="text-muted">Tên:</span> {user.profile?.displayName ?? '—'}
        </p>
      </div>
      <button type="button" className="tp-btn tp-btn-ghost w-full" onClick={onLogout}>
        Đăng xuất
      </button>
    </div>
  );
}
