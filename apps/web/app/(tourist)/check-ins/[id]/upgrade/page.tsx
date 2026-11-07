'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SkeletonListRow } from '@/app/_components/skeleton';

const PhotoUpgrade = dynamic(
  () => import('./photo-upgrade').then((m) => m.PhotoUpgrade),
  {
    loading: () => (
      <div className="space-y-6">
        <SkeletonListRow />
        <SkeletonListRow />
      </div>
    ),
    ssr: false,
  },
);

export default function UpgradeEvidencePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkinId = params.id;
  const type = searchParams.get('type') ?? 'photo';

  useEffect(() => {
    if (type === 'qr') {
      router.replace(`/check-in/scan?checkinId=${checkinId}`);
    }
  }, [type, checkinId, router]);

  if (type === 'qr') {
    return <p className="text-muted">Đang chuyển sang quét QR…</p>;
  }

  return <PhotoUpgrade checkinId={checkinId} />;
}
