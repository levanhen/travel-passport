'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/_components/toast';
import { addPhotoEvidence, fetchCheckin } from '@/app/(tourist)/_lib/check-in';
import { getErrorMessage } from '@/app/(tourist)/_lib/errors';
import { useInvalidateTouristData } from '@/app/(tourist)/_lib/queries';

export function PhotoUpgrade({ checkinId }: { checkinId: string }) {
  const router = useRouter();
  const toast = useToast();
  const invalidate = useInvalidateTouristData();
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCheckin(checkinId)
      .then((c) => setSiteName(c.siteName))
      .catch(() => toast.showError('Không tải được check-in.'));
  }, [checkinId, toast]);

  async function onPhotoSelected(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    try {
      const result = await addPhotoEvidence(checkinId, file);
      sessionStorage.setItem('tp_last_checkin', JSON.stringify(result));
      invalidate.afterCheckin();
      toast.showSuccess('Đã gửi ảnh — nhận thêm điểm!');
      router.push(`/check-in/success?id=${checkinId}`);
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : getErrorMessage('UNKNOWN'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href={`/check-in/success?id=${checkinId}`} className="tp-link text-sm">
        ← Quay lại
      </Link>

      <header>
        <h1 className="tp-page-title">Bổ sung bằng chứng</h1>
        <p className="tp-page-subtitle mt-1">{siteName || '…'}</p>
      </header>

      <div className="space-y-4">
        <p className="text-sm text-muted">Chụp ảnh tại chỗ để nhận thêm +15 điểm.</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => onPhotoSelected(e.target.files?.[0])}
        />
        <button
          type="button"
          className="tp-btn tp-btn-primary w-full"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
        >
          {loading ? 'Đang tải lên…' : 'Mở camera'}
        </button>
      </div>
    </div>
  );
}
