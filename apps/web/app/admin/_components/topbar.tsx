'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchMe, logout, StaffUser } from '@/app/admin/_lib/auth';
import { roleLabel } from '@/app/admin/_lib/errors';

export function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  async function onLogout() {
    await logout();
    router.replace('/admin/login');
  }

  const orgLabel =
    user?.role === 'site_operator'
      ? 'Site operator'
      : user?.role === 'authority_admin'
        ? 'Sở Du lịch Đà Nẵng'
        : 'Platform';

  return (
    <header className="flex min-h-[56px] items-center justify-between border-b border-border bg-white px-4 pl-14 md:pl-6">
      <div>
        <p className="text-sm font-medium text-gray-900">{orgLabel} · Đà Nẵng Pilot</p>
        {user && (
          <p className="text-xs text-muted">
            {roleLabel(user.role)} · {user.email}
          </p>
        )}
      </div>
      <button type="button" className="tp-btn tp-btn-ghost text-sm" onClick={onLogout}>
        Đăng xuất
      </button>
    </header>
  );
}
