'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchStaff, MerchantStaff } from '@/app/merchant/_lib/portal';

export default function MerchantStaffPage() {
  const [rows, setRows] = useState<MerchantStaff[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff()
      .then(setRows)
      .catch(() => setError('Không tải được staff (cần owner).'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nhân viên</h1>
        <Link href="/merchant/staff/new" className="tp-btn tp-btn-primary">
          + Thêm
        </Link>
      </div>
      {error && <p className="tp-alert-error">{error}</p>}
      {rows.length === 0 && !error && (
        <div className="tp-card text-center text-muted">Thêm nhân viên quầy</div>
      )}
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.id} className="tp-card text-sm">
            {s.email} · {s.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
