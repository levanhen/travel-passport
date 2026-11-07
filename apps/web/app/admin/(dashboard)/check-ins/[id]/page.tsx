'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/toast';
import { ApiRequestError } from '@/app/admin/_lib/api';
import {
  AdminCheckInDetail,
  fetchCheckInDetail,
  voidCheckIn,
} from '@/app/admin/_lib/check-ins';
import { fetchMe, StaffUser } from '@/app/admin/_lib/auth';
import { getErrorMessage } from '@/app/admin/_lib/errors';

export default function AdminCheckInDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState<AdminCheckInDetail | null>(null);
  const [user, setUser] = useState<StaffUser | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canVoid =
    user?.role === 'authority_admin' || user?.role === 'platform_admin';

  useEffect(() => {
    Promise.all([fetchCheckInDetail(params.id), fetchMe()])
      .then(([d, u]) => {
        setDetail(d);
        setUser(u);
      })
      .catch(() => setLoadError('Không tải được check-in.'));
  }, [params.id]);

  async function onVoid(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await voidCheckIn(params.id, reason.trim());
      toast.showSuccess('Đã void check-in.');
      router.push(`/admin/sites/${detail?.siteId}/check-ins`);
    } catch (err) {
      if (err instanceof ApiRequestError) toast.showError(getErrorMessage(err.code, err.message));
      else toast.showError('Void thất bại.');
    } finally {
      setLoading(false);
    }
  }

  if (!detail && !loadError) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/admin/sites/${detail?.siteId}/check-ins`} className="text-sm text-admin hover:underline">
        ← Check-ins
      </Link>
      <h1 className="text-2xl font-semibold">Chi tiết check-in</h1>

      {detail && (
        <div className="tp-card space-y-2 text-sm">
          <p>
            <span className="text-muted">Site:</span> {detail.siteName}
          </p>
          <p>
            <span className="text-muted">User:</span> {detail.userPhoneMasked}
          </p>
          <p>
            <span className="text-muted">Thời gian:</span>{' '}
            {new Date(detail.checkedInAt).toLocaleString('vi-VN')}
          </p>
          <p>
            <span className="text-muted">Proof:</span> {detail.proofLevel} · {detail.pointsAwarded}{' '}
            điểm
          </p>
          <p>
            <span className="text-muted">Trạng thái:</span> {detail.status}
          </p>
          {detail.voidReason && (
            <p className="text-red-600">
              Void: {detail.voidReason} ({detail.voidedByEmail})
            </p>
          )}
        </div>
      )}

      {canVoid && detail?.status === 'confirmed' && (
        <form onSubmit={onVoid} className="tp-card space-y-3 border-red-200">
          <p className="font-medium text-red-700">Void check-in (authority)</p>
          <textarea
            className="tp-input w-full"
            rows={3}
            placeholder="Lý do void (bắt buộc)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={3}
          />
          <button type="submit" className="tp-btn w-full bg-red-600 text-white hover:bg-red-700" disabled={loading}>
            {loading ? 'Đang void…' : 'Xác nhận void'}
          </button>
        </form>
      )}

      {loadError && <p className="tp-alert-error">{loadError}</p>}
    </div>
  );
}
