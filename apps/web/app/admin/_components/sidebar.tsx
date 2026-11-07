'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchMe, StaffUser } from '@/app/admin/_lib/auth';
import { navLinksForRole } from '@/app/admin/_lib/nav';

function NavLinks({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const links = navLinksForRole(role);

  return (
    <ul className="space-y-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-admin'
                  : 'text-gray-700 hover:bg-surface hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  const role = user?.role ?? 'platform_admin';

  return (
    <>
      <button
        type="button"
        className="tp-btn tp-btn-ghost fixed left-4 top-3 z-40 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Mở menu"
      >
        ☰
      </button>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-sidebar border-r border-border bg-white p-4 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-admin">Tourism BO</span>
          <button
            type="button"
            className="tp-btn tp-btn-ghost px-2 md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <NavLinks role={role} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
