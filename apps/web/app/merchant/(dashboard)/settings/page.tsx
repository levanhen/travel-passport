'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMe, logout, StaffUser } from '@/app/merchant/_lib/auth';

export default function MerchantSettingsPage() {
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
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      {user && (
        <div className="tp-card text-sm">
          <p>Email: {user.email}</p>
          <p className="mt-1 capitalize">Role: {user.role.replace('_', ' ')}</p>
        </div>
      )}
      <button type="button" className="tp-btn tp-btn-ghost w-full" onClick={onLogout}>
        Đăng xuất
      </button>
      <Link href="/merchant/profile" className="tp-link block text-center text-sm">
        ← Hồ sơ quán
      </Link>
    </div>
  );
}
