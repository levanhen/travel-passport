'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  NavIconHome,
  NavIconMap,
  NavIconPassport,
  NavIconTicket,
} from './nav-icons';

const tabs = [
  { href: '/', label: 'Trang chủ', Icon: NavIconHome, match: (p: string) => p === '/' },
  {
    href: '/sites',
    label: 'Điểm đến',
    Icon: NavIconMap,
    match: (p: string) => p.startsWith('/sites'),
  },
  {
    href: '/vouchers',
    label: 'Ưu đãi',
    Icon: NavIconTicket,
    match: (p: string) => p.startsWith('/vouchers'),
  },
  {
    href: '/passport',
    label: 'Passport',
    Icon: NavIconPassport,
    match: (p: string) => p.startsWith('/passport') || p.startsWith('/profile'),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-tourist -translate-x-1/2 border-t border-white/60 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(8,145,178,0.08)] backdrop-blur-md"
      aria-label="Điều hướng chính"
    >
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              className={`tp-pressable flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted hover:text-gray-800'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-slate-400'}`} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
