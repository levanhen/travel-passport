'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchMe, StaffUser } from '@/app/merchant/_lib/auth';
import { navLinksForRole } from '@/app/merchant/_lib/nav';
import { BottomNav } from './bottom-nav';
import { Topbar } from './topbar';

function DesktopSidebar({ user }: { user: StaffUser | null }) {
  const pathname = usePathname() ?? '';
  const links = user ? navLinksForRole(user.role) : [];

  return (
    <aside className="hidden w-sidebar shrink-0 border-r border-border bg-white p-4 md:block">
      <p className="mb-6 text-lg font-semibold text-merchant">Merchant</p>
      <ul className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? 'bg-orange-50 text-merchant' : 'text-gray-700 hover:bg-surface'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      <DesktopSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <BottomNav user={user} />
      </div>
    </div>
  );
}
