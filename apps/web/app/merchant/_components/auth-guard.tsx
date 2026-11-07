'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchMe, StaffUser } from '@/app/merchant/_lib/auth';
import { isMerchantRole } from '@/app/merchant/_lib/errors';
import { defaultMerchantHome, isOwnerOnlyPath } from '@/app/merchant/_lib/nav';

export function MerchantAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [user, setUser] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me || !isMerchantRole(me.role)) {
        router.replace('/merchant/login');
        return;
      }
      if (me.role === 'merchant_staff' && isOwnerOnlyPath(pathname)) {
        router.replace(defaultMerchantHome(me.role));
        return;
      }
      setUser(me);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted">
        Đang xác thực…
      </div>
    );
  }

  return <>{children}</>;
}
