'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchMe, logout, StaffUser } from '@/app/merchant/_lib/auth';
import { roleLabel } from '@/app/merchant/_lib/errors';

export function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  async function onLogout() {
    await logout();
    router.replace('/merchant/login');
  }

  return (
    <header className="flex min-h-[52px] items-center justify-between border-b border-border bg-white px-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">Merchant Portal</p>
        {user && <p className="text-xs text-muted">{roleLabel(user.role)}</p>}
      </div>
      <button type="button" className="tp-btn tp-btn-ghost text-sm" onClick={onLogout}>
        Đăng xuất
      </button>
    </header>
  );
}
