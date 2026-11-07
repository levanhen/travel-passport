'use client';

import { ToastProvider } from '@/app/_components/toast';
import { QueryProvider } from '@/app/_providers/query-provider';
import { TouristShell } from '@/app/(tourist)/_components/tourist-shell';

export default function TouristLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <TouristShell>{children}</TouristShell>
      </ToastProvider>
    </QueryProvider>
  );
}
