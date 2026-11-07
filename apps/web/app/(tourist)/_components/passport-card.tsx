import Link from 'next/link';
import { LevelBadge } from './level-badge';
import { PointsSummary } from '@/app/(tourist)/_lib/points';

export function PassportCard({
  summary,
  href = '/passport',
  asLink = true,
}: {
  summary: PointsSummary;
  href?: string;
  asLink?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-800/80">
            Tourism Passport
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary.balance}</p>
          <p className="text-sm font-medium text-gray-600">điểm tích lũy</p>
        </div>
        <LevelBadge level={summary.level} label={summary.levelLabel} size="sm" />
      </div>
      {summary.nextLevel && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-600">
            <span>Tiến độ level</span>
            <span>→ {summary.nextLevel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ocean to-primary"
              style={{
                width: `${Math.min(
                  92,
                  Math.max(
                    8,
                    Math.round(
                      (summary.lifetimePoints /
                        (summary.lifetimePoints + summary.pointsToNextLevel)) *
                        100,
                    ),
                  ),
                )}%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Còn {summary.pointsToNextLevel} điểm để lên {summary.nextLevel}
          </p>
        </div>
      )}
    </>
  );

  if (!asLink) {
    return <div className="tp-passport-card">{inner}</div>;
  }

  return (
    <Link href={href} className="tp-passport-card block">
      {inner}
    </Link>
  );
}
