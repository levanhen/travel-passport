'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminSite, fetchAdminSite } from '@/app/admin/_lib/sites';

export default function AdminSiteDetailPage() {
  const params = useParams<{ id: string }>();
  const [site, setSite] = useState<AdminSite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSite(params.id)
      .then(setSite)
      .catch(() => setError('Không tải được site.'));
  }, [params.id]);

  if (error) return <p className="tp-alert-error">{error}</p>;
  if (!site) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="space-y-6">
      <Link href="/admin/sites" className="text-sm text-admin hover:underline">
        ← Sites
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{site.name}</h1>
          <p className="mt-1 text-sm text-muted capitalize">
            {site.participationLevel} · {site.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/sites/${site.id}/edit`} className="tp-btn tp-btn-secondary">
            Sửa
          </Link>
          {site.participationLevel === 'partner' && site.qrMode === 'rotating' && (
            <Link href={`/admin/sites/${site.id}/qr`} className="tp-btn tp-btn-primary">
              QR kiosk
            </Link>
          )}
        </div>
      </header>

      <div className="tp-card grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted">Slug</p>
          <p>{site.slug}</p>
        </div>
        <div>
          <p className="text-muted">Category</p>
          <p>{site.category}</p>
        </div>
        <div>
          <p className="text-muted">Tọa độ</p>
          <p>
            {site.latitude}, {site.longitude}
          </p>
        </div>
        <div>
          <p className="text-muted">Geofence</p>
          <p>{site.geofenceRadiusMeters}m</p>
        </div>
        {site.address && (
          <div className="sm:col-span-2">
            <p className="text-muted">Địa chỉ</p>
            <p>{site.address}</p>
          </div>
        )}
        {site.description && (
          <div className="sm:col-span-2">
            <p className="text-muted">Mô tả</p>
            <p>{site.description}</p>
          </div>
        )}
      </div>

      <Link
        href={`/admin/sites/${site.id}/check-ins`}
        className="tp-card block hover:shadow-md"
      >
        <p className="font-medium">Check-ins tại site này</p>
        <p className="mt-1 text-sm text-muted">Xem danh sách và void (authority)</p>
      </Link>
    </div>
  );
}
