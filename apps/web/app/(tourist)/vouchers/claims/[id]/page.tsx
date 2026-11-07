'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchMyClaims, VoucherClaim } from '@/app/(tourist)/_lib/vouchers';

export default function VoucherClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const [claim, setClaim] = useState<VoucherClaim | null>(null);

  useEffect(() => {
    fetchMyClaims().then((list) => setClaim(list.find((c) => c.id === params.id) ?? null));
  }, [params.id]);

  if (!claim) {
    return <p className="text-muted">Đang tải…</p>;
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(claim.qrPayload)}`;

  return (
    <div className="space-y-5 text-center">
      <Link href="/vouchers/claims" className="tp-link text-sm">
        ← Voucher của tôi
      </Link>
      <h1 className="tp-page-title">{claim.voucherTitle}</h1>
      <p className="text-muted">{claim.merchantName}</p>
      <div className="tp-card space-y-4">
        <img
          src={qrUrl}
          alt={`QR voucher ${claim.claimCode}`}
          className="mx-auto rounded-lg bg-white p-3"
          width={280}
          height={280}
        />
        <p className="font-mono text-2xl">{claim.claimCode}</p>
        <p className="text-sm">{claim.discountLabel}</p>
        <p className="text-xs text-muted">Hết hạn: {new Date(claim.expiresAt).toLocaleDateString('vi-VN')}</p>
      </div>
      <p className="text-sm text-muted">Đưa mã QR hoặc mã {claim.claimCode} cho merchant để redeem.</p>
    </div>
  );
}
