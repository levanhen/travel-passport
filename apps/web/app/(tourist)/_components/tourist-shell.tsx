'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function TouristShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname?.startsWith('/auth');

  if (isAuth) {
    return <div className="tp-tourist-shell-auth">{children}</div>;
  }

  return (
    <div className="tp-tourist-shell">
      <div className="tp-tourist-main tp-page-enter">{children}</div>
      <BottomNav />
    </div>
  );
}
