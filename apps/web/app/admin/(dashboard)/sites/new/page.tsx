'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/admin/_lib/api';
import { getErrorMessage } from '@/app/admin/_lib/errors';
import { createSite, fetchPilotDestination } from '@/app/admin/_lib/sites';

const CATEGORIES = ['HERITAGE', 'BEACH', 'NATURE', 'MOUNTAIN', 'ISLAND', 'CULTURAL', 'FOOD', 'OTHER'];

export default function AdminSiteNewPage() {
  const router = useRouter();
  const [destinationId, setDestinationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPilotDestination()
      .then((d) => setDestinationId(d.id))
      .catch(() => setError('Không tải destination.'));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const site = await createSite({
        participationLevel: fd.get('participationLevel') as 'catalog' | 'partner',
        destinationId,
        name: String(fd.get('name')),
        slug: String(fd.get('slug')),
        latitude: Number(fd.get('latitude')),
        longitude: Number(fd.get('longitude')),
        category: String(fd.get('category')),
        description: String(fd.get('description') || '') || undefined,
        address: String(fd.get('address') || '') || undefined,
        geofenceRadiusMeters: Number(fd.get('geofenceRadiusMeters') || 50),
        status: 'draft',
      });
      router.push(`/admin/sites/${site.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Tạo site thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/admin/sites" className="text-sm text-admin hover:underline">
        ← Sites
      </Link>
      <h1 className="text-2xl font-semibold">Tạo site</h1>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block text-sm">
          Loại
          <select name="participationLevel" className="tp-input mt-1 w-full" defaultValue="catalog">
            <option value="catalog">Catalog</option>
            <option value="partner">Partner</option>
          </select>
        </label>
        <label className="block text-sm">
          Tên *
          <input name="name" className="tp-input mt-1 w-full" required />
        </label>
        <label className="block text-sm">
          Slug *
          <input name="slug" className="tp-input mt-1 w-full" pattern="[a-z0-9-]+" required />
        </label>
        <label className="block text-sm">
          Category *
          <select name="category" className="tp-input mt-1 w-full" required>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Lat *
            <input name="latitude" type="number" step="any" className="tp-input mt-1 w-full" required />
          </label>
          <label className="block text-sm">
            Lng *
            <input name="longitude" type="number" step="any" className="tp-input mt-1 w-full" required />
          </label>
        </div>
        <label className="block text-sm">
          Geofence (m)
          <input name="geofenceRadiusMeters" type="number" className="tp-input mt-1 w-full" defaultValue={50} />
        </label>
        <label className="block text-sm">
          Địa chỉ
          <input name="address" className="tp-input mt-1 w-full" />
        </label>
        <label className="block text-sm">
          Mô tả
          <textarea name="description" className="tp-input mt-1 w-full" rows={3} />
        </label>
        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading || !destinationId}>
          {loading ? 'Đang tạo…' : 'Tạo site (draft)'}
        </button>
      </form>
    </div>
  );
}
