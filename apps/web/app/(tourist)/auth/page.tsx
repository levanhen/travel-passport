'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/app/(tourist)/_components/auth-shell';
import { getAccessToken } from '@/app/(tourist)/_lib/auth';

export default function AuthIndexPage() {
  const router = useRouter();
  useEffect(() => {
    if (getAccessToken()) router.replace('/');
    else router.replace('/auth/start');
  }, [router]);

  return (
    <AuthShell title="Đang chuyển…" subtitle="Vui lòng đợi trong giây lát.">
      <p className="text-center text-muted">Đang mở Passport…</p>
    </AuthShell>
  );
}
