'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/admin/_lib/api';
import { getErrorMessage } from '@/app/admin/_lib/errors';
import { AdminSite, fetchAdminSite, patchSite } from '@/app/admin/_lib/sites';

export default function AdminSiteEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [site, setSite] = useState<AdminSite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSite(params.id)
      .then(setSite)
      .catch(() => setError('Không tải được site.'));
  }, [params.id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData(e.currentTarget);
      await patchSite(params.id, {
        name: String(fd.get('name')),
        slug: String(fd.get('slug')),
        status: String(fd.get('status')),
        checkInEnabled: fd.get('checkInEnabled') === 'on',
        description: String(fd.get('description') || '') || undefined,
        address: String(fd.get('address') || '') || undefined,
      });
      router.push(`/admin/sites/${params.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Cập nhật thất bại.');
    } finally {
      setLoading(false);
    }
  }

  if (!site && !error) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href={`/admin/sites/${params.id}`} className="text-sm text-admin hover:underline">
        ← Chi tiết site
      </Link>
      <h1 className="text-2xl font-semibold">Sửa site</h1>

      {site && (
        <form onSubmit={onSubmit} className="tp-card space-y-4">
          <label className="block text-sm">
            Tên
            <input name="name" className="tp-input mt-1 w-full" defaultValue={site.name} required />
          </label>
          <label className="block text-sm">
            Slug
            <input name="slug" className="tp-input mt-1 w-full" defaultValue={site.slug} required />
          </label>
          <label className="block text-sm">
            Trạng thái
            <select name="status" className="tp-input mt-1 w-full" defaultValue={site.status}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="checkInEnabled" type="checkbox" defaultChecked={site.checkInEnabled} />
            Bật check-in
          </label>
          <label className="block text-sm">
            Địa chỉ
            <input name="address" className="tp-input mt-1 w-full" defaultValue={site.address ?? ''} />
          </label>
          <label className="block text-sm">
            Mô tả
            <textarea
              name="description"
              className="tp-input mt-1 w-full"
              rows={3}
              defaultValue={site.description ?? ''}
            />
          </label>
          {error && <p className="tp-alert-error">{error}</p>}
          <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
            {loading ? 'Đang lưu…' : 'Lưu'}
          </button>
        </form>
      )}
    </div>
  );
}
