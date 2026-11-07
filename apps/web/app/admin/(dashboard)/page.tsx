'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMe } from '@/app/admin/_lib/auth';
import { AdminDashboard, fetchAdminDashboard } from '@/app/admin/_lib/dashboard';
import { isAuthorityRole } from '@/app/admin/_lib/nav';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe().then((user) => {
      if (user?.role === 'site_operator') {
        router.replace('/admin/sites');
      }
    });
    fetchAdminDashboard()
      .then(setData)
      .catch(() => setError('Không tải được dashboard.'));
  }, [router]);

  const isAuthority = data ? isAuthorityRole(data.role) : false;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          {data?.destinationName ?? 'Đà Nẵng Pilot'}
          {data?.organizationName ? ` · ${data.organizationName}` : ''}
        </p>
      </header>

      {error && <p className="tp-alert-error">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="tp-card">
              <p className="text-sm text-muted">Check-in hôm nay</p>
              <p className="mt-1 text-3xl font-semibold text-admin">{data.checkInsToday}</p>
            </div>
            <div className="tp-card">
              <p className="text-sm text-muted">Check-in 7 ngày</p>
              <p className="mt-1 text-3xl font-semibold text-admin">{data.checkIns7Days}</p>
            </div>
            {isAuthority ? (
              <>
                <Link href="/admin/merchants" className="tp-card block hover:shadow-md">
                  <p className="text-sm text-muted">Merchant active</p>
                  <p className="mt-1 text-3xl font-semibold text-admin">{data.merchantsActive}</p>
                </Link>
                <Link href="/admin/badges" className="tp-card block hover:shadow-md">
                  <p className="text-sm text-muted">Badge published</p>
                  <p className="mt-1 text-3xl font-semibold text-admin">{data.badgesPublished}</p>
                </Link>
              </>
            ) : (
              <Link href="/admin/sites" className="tp-card block hover:shadow-md sm:col-span-2">
                <p className="text-sm text-muted">Site partner (org)</p>
                <p className="mt-1 text-3xl font-semibold text-admin">{data.sites.total}</p>
              </Link>
            )}
          </div>

          <Link href="/admin/sites" className="tp-card block hover:shadow-md">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Sites</p>
                <p className="mt-1 text-2xl font-semibold">{data.sites.total} tổng</p>
              </div>
              {isAuthority && (
                <div className="flex gap-6 text-sm text-muted">
                  <span>Catalog: {data.sites.catalog}</span>
                  <span>Partner: {data.sites.partner}</span>
                  <span>Published: {data.sites.published}</span>
                </div>
              )}
            </div>
          </Link>

          {isAuthority && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/admin/sites/new" className="tp-btn tp-btn-primary text-center">
                + Tạo site
              </Link>
              <Link href="/admin/merchants/new" className="tp-btn tp-btn-secondary text-center">
                + Onboard merchant
              </Link>
              <Link href="/admin/badges/new" className="tp-btn tp-btn-secondary text-center">
                + Tạo badge
              </Link>
            </div>
          )}

          <section>
            <h2 className="mb-3 text-lg font-medium">Check-in gần đây</h2>
            {data.recentCheckIns.length === 0 ? (
              <div className="tp-card text-center text-muted">Chưa có check-in</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border bg-white">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-border bg-surface text-left text-muted">
                    <tr>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Site</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Proof</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentCheckIns.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{formatDateTime(c.checkedInAt)}</td>
                        <td className="px-4 py-3">{c.siteName}</td>
                        <td className="px-4 py-3">{c.userPhoneMasked ?? '—'}</td>
                        <td className="px-4 py-3">{c.proofLevel}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/check-ins/${c.id}`} className="text-admin hover:underline">
                            {c.status}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
