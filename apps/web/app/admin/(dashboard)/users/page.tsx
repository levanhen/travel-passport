'use client';

import Link from 'next/link';

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Staff users</h1>
      <div className="tp-card space-y-3 text-sm text-gray-700">
        <p>
          MVP pilot: tài khoản staff được tạo qua <strong>seed</strong> hoặc env (
          <code className="text-xs">packages/db/.env</code>).
        </p>
        <p className="text-muted">API <code className="text-xs">POST /admin/users</code> — post-MVP.</p>
        <ul className="list-inside list-disc space-y-1 text-muted">
          <li>platform_admin — admin@travelpassport.local</li>
          <li>authority_admin — authority@travelpassport.local</li>
          <li>site_operator — operator@ngu-hanh-son.local (và org khác)</li>
        </ul>
      </div>
      <Link href="/admin/profile" className="tp-link text-sm">
        ← Profile
      </Link>
    </div>
  );
}
