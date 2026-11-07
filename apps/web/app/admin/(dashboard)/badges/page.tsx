'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminBadge, fetchAdminBadges } from '@/app/admin/_lib/badges';

export default function AdminBadgesPage() {
  const [rows, setRows] = useState<AdminBadge[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminBadges()
      .then(setRows)
      .catch(() => setError('Không tải được badges.'));
  }, []);

  const filtered = filter ? rows.filter((b) => b.status === filter) : rows;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Badges</h1>
        <Link href="/admin/badges/new" className="tp-btn tp-btn-primary">
          + Tạo badge
        </Link>
      </div>

      <select
        className="tp-input text-sm"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="">Tất cả trạng thái</option>
        <option value="draft">draft</option>
        <option value="published">published</option>
        <option value="archived">archived</option>
      </select>

      {error && <p className="tp-alert-error">{error}</p>}

      <ul className="space-y-3">
        {filtered.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/badges/${b.id}`} className="tp-card block hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-sm text-muted">
                    {b.slug} · {b.criteriaType}
                  </p>
                </div>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs capitalize">{b.status}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
