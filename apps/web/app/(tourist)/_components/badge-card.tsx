import Image from 'next/image';
import { getBadgeVisual } from '@/app/(tourist)/_lib/badge-icons';

export type BadgeCardData = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  earned: boolean;
  iconUrl?: string | null;
  progress?: { current: number; target: number };
  progressLabel?: string;
};

type BadgeCardProps = {
  badge: BadgeCardData;
  size?: 'sm' | 'md';
  layout?: 'grid' | 'row';
};

const MEDAL_SIZE = { sm: 52, md: 64 } as const;

function ProgressRing({
  size,
  current,
  target,
}: {
  size: number;
  current: number;
  target: number;
}) {
  if (target <= 1) return null;
  const stroke = 3;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, current / target));
  const offset = c * (1 - pct);

  return (
    <svg
      className="absolute inset-0 -rotate-90"
      width={size}
      height={size}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-gray-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="text-primary transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

function BadgeMedal({
  slug,
  iconUrl,
  earned,
  size,
  progress,
}: {
  slug: string;
  iconUrl?: string | null;
  earned: boolean;
  size: number;
  progress?: { current: number; target: number };
}) {
  const visual = getBadgeVisual(slug);
  const showRing =
    !earned && progress && progress.target > 1 && progress.current < progress.target;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {showRing && (
        <ProgressRing
          size={size}
          current={progress.current}
          target={progress.target}
        />
      )}
      <div
        className={`absolute inset-[3px] flex items-center justify-center rounded-full bg-gradient-to-br shadow-md ring-2 ring-inset ${visual.gradient} ${visual.ring} ${
          earned ? 'shadow-primary/20' : 'grayscale opacity-55'
        }`}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt=""
            width={size - 20}
            height={size - 20}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <span
            className="select-none leading-none"
            style={{ fontSize: Math.round(size * 0.42) }}
            aria-hidden
          >
            {visual.emoji}
          </span>
        )}
      </div>
      {earned && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow ring-2 ring-white"
          aria-hidden
        >
          ✓
        </span>
      )}
    </div>
  );
}

export function BadgeCard({ badge, size = 'md', layout = 'grid' }: BadgeCardProps) {
  const medalSize = MEDAL_SIZE[size];
  const visual = getBadgeVisual(badge.slug);

  if (layout === 'row') {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border border-border bg-surface p-3 ${
          badge.earned ? 'border-primary/20 bg-primary/5' : ''
        }`}
      >
        <BadgeMedal
          slug={badge.slug}
          iconUrl={badge.iconUrl}
          earned={badge.earned}
          size={medalSize}
          progress={badge.progress}
        />
        <div className="min-w-0 flex-1 text-left">
          <p className={`font-semibold leading-tight ${badge.earned ? 'text-gray-900' : 'text-gray-600'}`}>
            {badge.name}
          </p>
          {badge.progressLabel && (
            <p className="mt-0.5 text-xs text-muted">{badge.progressLabel}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <article
      className={`tp-card flex flex-col items-center p-4 text-center transition-shadow ${
        badge.earned ? `ring-1 ring-inset ${visual.ring} shadow-sm` : 'opacity-90'
      }`}
    >
      <BadgeMedal
        slug={badge.slug}
        iconUrl={badge.iconUrl}
        earned={badge.earned}
        size={medalSize}
        progress={badge.progress}
      />
      <h2 className={`mt-3 line-clamp-2 text-sm font-semibold leading-snug ${badge.earned ? 'text-gray-900' : 'text-gray-700'}`}>
        {badge.name}
      </h2>
      {badge.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{badge.description}</p>
      )}
      <p
        className={`mt-2 text-xs font-medium ${
          badge.earned ? 'text-primary' : 'text-muted'
        }`}
      >
        {badge.earned ? '✓ Đã đạt' : badge.progressLabel ?? 'Chưa mở'}
      </p>
    </article>
  );
}
