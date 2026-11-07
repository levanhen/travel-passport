import Link from 'next/link';

type AuthShellProps = {
  title: string;
  subtitle?: string;
  step?: 'phone' | 'pin';
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

function StepIndicator({ step }: { step: 'phone' | 'pin' }) {
  const phoneDone = step === 'pin';
  return (
    <div className="mt-5 flex items-center justify-center gap-2" aria-label="Tiến trình đăng ký">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            phoneDone ? 'bg-white/25 text-white' : 'bg-white text-primary'
          }`}
        >
          {phoneDone ? '✓' : '1'}
        </span>
        <span className="text-xs font-medium text-sky-100">SĐT</span>
      </div>
      <span className="h-px w-8 bg-white/30" aria-hidden />
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            step === 'pin' ? 'bg-white text-primary' : 'bg-white/15 text-white/70'
          }`}
        >
          2
        </span>
        <span className="text-xs font-medium text-sky-100">PIN</span>
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  step,
  children,
  backHref,
  backLabel,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative overflow-hidden bg-gradient-to-br from-ocean to-primary px-5 pb-12 pt-10 text-white shadow-card">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-10 left-4 h-20 w-20 rounded-full bg-white/10" aria-hidden />
        <div className="relative mx-auto w-full max-w-tourist">
          <p className="text-sm font-medium text-sky-100">Đà Nẵng Pilot</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">Tourism Passport</p>
          <p className="mt-1 text-sm text-sky-100/90">Check-in · Điểm · Ưu đãi</p>
          {step && <StepIndicator step={step} />}
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-tourist flex-1 px-4 pb-8">
        <div className="-mt-8 rounded-2xl border border-border/80 bg-white p-5 shadow-card">
          {backHref && (
            <Link href={backHref} className="tp-link mb-4 inline-block text-sm">
              ← {backLabel ?? 'Quay lại'}
            </Link>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="tp-page-subtitle mt-1">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/legal/terms" className="tp-link">
            Điều khoản
          </Link>
          {' · '}
          <Link href="/legal/privacy" className="tp-link">
            Quyền riêng tư
          </Link>
        </p>
      </div>
    </div>
  );
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone || '—';
  return `+84 *** *** ${digits.slice(-4)}`;
}
