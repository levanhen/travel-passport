'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/admin/_lib/api';
import { AdminBadge, fetchAdminBadge, patchBadge } from '@/app/admin/_lib/badges';
import { getErrorMessage } from '@/app/admin/_lib/errors';

export default function AdminBadgeEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [badge, setBadge] = useState<AdminBadge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminBadge(params.id)
      .then(setBadge)
      .catch(() => setError('Không tải được badge.'));
  }, [params.id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!badge) return;
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      await patchBadge(params.id, {
        name: String(fd.get('name')),
        description: String(fd.get('description')),
        sortOrder: Number(fd.get('sortOrder') || 0),
      });
      router.push('/admin/badges');
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Lưu thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(status: string) {
    setLoading(true);
    setError(null);
    try {
      await patchBadge(params.id, { status });
      const updated = await fetchAdminBadge(params.id);
      setBadge(updated);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Cập nhật trạng thái thất bại.');
    } finally {
      setLoading(false);
    }
  }

  if (!badge && !error) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/admin/badges" className="text-sm text-admin hover:underline">
        ← Badges
      </Link>

      {badge && (
        <>
          <header>
            <h1 className="text-2xl font-semibold">{badge.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {badge.slug} · {badge.status} · {badge.criteriaType}
            </p>
          </header>

          <div className="tp-card text-sm">
            <p className="font-medium text-muted">Criteria (JSON)</p>
            <pre className="mt-2 overflow-x-auto rounded bg-surface p-2 text-xs">
              {JSON.stringify(badge.criteria, null, 2)}
            </pre>
          </div>

          <form onSubmit={onSubmit} className="tp-card space-y-4">
            <label className="block text-sm">
              Tên
              <input name="name" className="tp-input mt-1 w-full" defaultValue={badge.name} required />
            </label>
            <label className="block text-sm">
              Mô tả
              <textarea
                name="description"
                className="tp-input mt-1 w-full"
                rows={2}
                defaultValue={badge.description ?? ''}
                required
              />
            </label>
            <label className="block text-sm">
              sortOrder
              <input
                name="sortOrder"
                type="number"
                className="tp-input mt-1 w-full"
                defaultValue={badge.sortOrder}
              />
            </label>
            {error && <p className="tp-alert-error">{error}</p>}
            <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading}>
              Lưu
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {badge.status === 'draft' && (
              <button
                type="button"
                className="tp-btn tp-btn-primary"
                disabled={loading}
                onClick={() => setStatus('published')}
              >
                Publish
              </button>
            )}
            {badge.status === 'published' && (
              <button
                type="button"
                className="tp-btn tp-btn-secondary"
                disabled={loading}
                onClick={() => setStatus('archived')}
              >
                Archive
              </button>
            )}
          </div>
        </>
      )}
      {error && !badge && <p className="tp-alert-error">{error}</p>}
    </div>
  );
}
