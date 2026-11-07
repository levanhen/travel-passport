'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiRequestError } from '@/app/admin/_lib/api';
import { createBadge } from '@/app/admin/_lib/badges';
import { getErrorMessage } from '@/app/admin/_lib/errors';
import { fetchPilotDestination } from '@/app/admin/_lib/sites';

const CATEGORIES = ['', 'HERITAGE', 'BEACH', 'NATURE', 'MOUNTAIN', 'CULTURAL', 'FOOD'];

export default function AdminBadgeNewPage() {
  const router = useRouter();
  const [destinationId, setDestinationId] = useState('');
  const [criteriaType, setCriteriaType] = useState<'FIRST_CHECKIN' | 'CHECKIN_COUNT'>(
    'CHECKIN_COUNT',
  );
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

    const type = String(fd.get('criteriaType')) as 'FIRST_CHECKIN' | 'CHECKIN_COUNT';
    const criteria: Record<string, unknown> = { destinationId };
    if (type === 'CHECKIN_COUNT') {
      criteria.count = Number(fd.get('count') || 1);
      criteria.distinctSites = fd.get('distinctSites') === 'on';
      const cat = String(fd.get('siteCategory') || '');
      if (cat) criteria.siteCategory = cat;
      const minProof = String(fd.get('minProofLevel') || 'L0');
      if (minProof) criteria.minProofLevel = minProof;
      if (fd.get('requirePhoto') === 'on') criteria.requirePhoto = true;
    }

    try {
      const badge = await createBadge({
        slug: String(fd.get('slug')),
        name: String(fd.get('name')),
        description: String(fd.get('description')),
        destinationId,
        criteriaType: type,
        criteria,
        sortOrder: Number(fd.get('sortOrder') || 0),
      });
      router.push(`/admin/badges/${badge.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(getErrorMessage(err.code, err.message));
      else setError('Tạo badge thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/admin/badges" className="text-sm text-admin hover:underline">
        ← Badges
      </Link>
      <h1 className="text-2xl font-semibold">Tạo badge</h1>

      <form onSubmit={onSubmit} className="tp-card space-y-4">
        <label className="block text-sm">
          Slug *
          <input name="slug" className="tp-input mt-1 w-full" pattern="[a-z0-9-]+" required />
        </label>
        <label className="block text-sm">
          Tên *
          <input name="name" className="tp-input mt-1 w-full" required />
        </label>
        <label className="block text-sm">
          Mô tả *
          <textarea name="description" className="tp-input mt-1 w-full" rows={2} required />
        </label>
        <label className="block text-sm">
          Loại rule *
          <select
            name="criteriaType"
            className="tp-input mt-1 w-full"
            value={criteriaType}
            onChange={(e) =>
              setCriteriaType(e.target.value as 'FIRST_CHECKIN' | 'CHECKIN_COUNT')
            }
          >
            <option value="FIRST_CHECKIN">FIRST_CHECKIN</option>
            <option value="CHECKIN_COUNT">CHECKIN_COUNT</option>
          </select>
        </label>

        {criteriaType === 'CHECKIN_COUNT' && (
          <>
            <label className="block text-sm">
              Số check-in cần đạt
              <input name="count" type="number" min={1} className="tp-input mt-1 w-full" defaultValue={3} />
            </label>
            <label className="block text-sm">
              Category (tuỳ chọn)
              <select name="siteCategory" className="tp-input mt-1 w-full" defaultValue="">
                {CATEGORIES.map((c) => (
                  <option key={c || 'any'} value={c}>
                    {c || 'Mọi category'}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              minProofLevel
              <select name="minProofLevel" className="tp-input mt-1 w-full" defaultValue="L0">
                <option value="L0">L0</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="distinctSites" type="checkbox" defaultChecked />
              Đếm site khác nhau
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="requirePhoto" type="checkbox" />
              Yêu cầu có ảnh
            </label>
          </>
        )}

        <label className="block text-sm">
          sortOrder
          <input name="sortOrder" type="number" className="tp-input mt-1 w-full" defaultValue={10} />
        </label>

        {error && <p className="tp-alert-error">{error}</p>}
        <button type="submit" className="tp-btn tp-btn-primary w-full" disabled={loading || !destinationId}>
          {loading ? 'Đang tạo…' : 'Lưu draft'}
        </button>
      </form>
    </div>
  );
}
