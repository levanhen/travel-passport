import Link from 'next/link';

const TILE_STYLES: Record<string, string> = {
  checkin: 'from-emerald-500/20 to-teal-500/10 text-emerald-950 ring-1 ring-emerald-500/20',
  sites: 'from-sky-500/15 to-cyan-500/5 text-sky-900',
  passport: 'from-amber-400/20 to-orange-300/10 text-amber-950',
  vouchers: 'from-orange-500/15 to-rose-500/5 text-orange-950',
};

export function QuickActionTile({
  href,
  title,
  description,
  icon,
  variant,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: keyof typeof TILE_STYLES;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={`tp-card-interactive tp-pressable flex items-center gap-4 bg-gradient-to-br ${TILE_STYLES[variant]}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-80">{description}</p>
      </div>
      <span className="text-lg opacity-40" aria-hidden>
        →
      </span>
    </Link>
  );
}
