const LEVEL_STYLES: Record<string, string> = {
  TRAVELLER: 'bg-slate-100 text-slate-700 ring-slate-200',
  EXPLORER: 'bg-sky-100 text-sky-800 ring-sky-200',
  LOCAL_INSIDER: 'bg-amber-100 text-amber-900 ring-amber-200',
};

export function LevelBadge({
  level,
  label,
  size = 'md',
}: {
  level: string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.TRAVELLER;
  const text = label ?? level.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset ${style} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span aria-hidden>✦</span>
      {text}
    </span>
  );
}
