import { ToastProvider } from '@/app/_components/toast';
import { DashboardLayout } from '@/app/admin/_components/dashboard-layout';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  );
}
