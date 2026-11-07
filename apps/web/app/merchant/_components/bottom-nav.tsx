'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StaffUser } from '@/app/merchant/_lib/auth';
import { mobileTabsForRole } from '@/app/merchant/_lib/nav';

export function BottomNav({ user }: { user: StaffUser | null }) {
  const pathname = usePathname() ?? '';
  const tabs = user ? mobileTabsForRole(user.role) : [];

  if (tabs.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Điều hướng merchant"
    >
      <div style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className="grid">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          if (tab.emphasis) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-[56px] flex-col items-center justify-center text-xs font-semibold ${
                  active ? 'text-merchant' : 'text-merchant'
                }`}
              >
                <span
                  className={`mb-0.5 flex h-10 w-10 items-center justify-center rounded-full text-lg text-white ${
                    active ? 'bg-orange-600 ring-2 ring-orange-200' : 'bg-merchant shadow-md'
                  }`}
                >
                  ⌖
                </span>
                {tab.label}
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-[56px] flex-col items-center justify-center text-xs font-medium ${
                active ? 'text-merchant' : 'text-muted'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
