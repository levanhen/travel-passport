'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchMe, StaffUser } from '@/app/admin/_lib/auth';
import { AdminSite, fetchAdminSites, fetchPilotDestination } from '@/app/admin/_lib/sites';
import { isAuthorityRole } from '@/app/admin/_lib/nav';
import { fetchAdminDashboard, AdminDashboard } from '@/app/admin/_lib/dashboard';

const CATEGORIES = ['', 'HERITAGE', 'BEACH', 'NATURE', 'MOUNTAIN', 'CULTURAL', 'FOOD', 'OTHER'];

export default function AdminSitesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participation = searchParams.get('participation') ?? '';
  const category = searchParams.get('category') ?? '';

  const [sites, setSites] = useState<AdminSite[]>([]);
  const [summary, setSummary] = useState<AdminDashboard | null>(null);
  const [user, setUser] = useState<StaffUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
    fetchAdminDashboard()
      .then(setSummary)
      .catch(() => {
        /* operator may not need summary on error */
      });
  }, []);

  useEffect(() => {
    fetchPilotDestination()
      .then((dest) =>
        fetchAdminSites(dest.id, {
          participationLevel: participation || undefined,
          category: category || undefined,
        }),
      )
      .then(setSites)
      .catch(() => setError('Không tải được danh sách site.'));
  }, [participation, category]);

  const canCreate = user ? isAuthorityRole(user.role) : false;

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`/admin/sites?${p.toString()}`);
  }

  return (
    <div className="space-y-6">
      {user?.role === 'site_operator' && summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="tp-card">
            <p className="text-sm text-muted">Check-in hôm nay</p>
            <p className="mt-1 text-2xl font-semibold text-admin">{summary.checkInsToday}</p>
          </div>
          <div className="tp-card">
            <p className="text-sm text-muted">Check-in 7 ngày</p>
            <p className="mt-1 text-2xl font-semibold text-admin">{summary.checkIns7Days}</p>
          </div>
          <div className="tp-card">
            <p className="text-sm text-muted">Site của bạn</p>
            <p className="mt-1 text-2xl font-semibold text-admin">{summary.sites.total}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Sites</h1>
          <p className="mt-1 text-sm text-muted">{sites.length} điểm</p>
        </header>
        {canCreate && (
          <Link href="/admin/sites/new" className="tp-btn tp-btn-primary shrink-0">
            + Tạo site
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="tp-input text-sm"
          value={participation}
          onChange={(e) => setFilter('participation', e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="catalog">Catalog</option>
          <option value="partner">Partner</option>
        </select>
        <select
          className="tp-input text-sm"
          value={category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c || 'all'} value={c}>
              {c || 'Tất cả category'}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="tp-alert-error">{error}</p>}

      {sites.length === 0 && !error && (
        <div className="tp-card text-center text-muted">Chưa có điểm — thêm catalog POI</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/sites/${s.id}`} className="font-medium text-admin hover:underline">
                    {s.name}
                  </Link>
                  <p className="text-xs text-muted">{s.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize">{s.participationLevel}</td>
                <td className="px-4 py-3">{s.category}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">{s.checkInEnabled ? 'Bật' : 'Tắt'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
