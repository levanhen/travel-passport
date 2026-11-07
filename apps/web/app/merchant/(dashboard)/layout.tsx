import { ToastProvider } from '@/app/_components/toast';
import { DashboardLayout } from '@/app/merchant/_components/dashboard-layout';
import { MerchantAuthGuard } from '@/app/merchant/_components/auth-guard';

export default function MerchantDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <MerchantAuthGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </MerchantAuthGuard>
    </ToastProvider>
  );
}
