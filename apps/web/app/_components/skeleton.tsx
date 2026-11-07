function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} aria-hidden />;
}

export function SkeletonPassportCard() {
  return (
    <div className="tp-passport-card space-y-4 p-5">
      <Bone className="h-4 w-24" />
      <Bone className="h-10 w-32" />
      <Bone className="h-3 w-full max-w-[200px]" />
      <div className="flex gap-2">
        <Bone className="h-8 w-20 rounded-full" />
        <Bone className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonSiteCard() {
  return (
    <div className="tp-card overflow-hidden p-0">
      <Bone className="h-36 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Bone className="h-5 w-3/4" />
        <Bone className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="tp-card space-y-2">
      <Bone className="h-4 w-2/3" />
      <Bone className="h-3 w-1/3" />
    </div>
  );
}

export function SkeletonHomePage() {
  return (
    <div className="space-y-6">
      <Bone className="h-32 w-full rounded-2xl" />
      <SkeletonPassportCard />
      <Bone className="h-20 w-full rounded-2xl" />
      <div className="grid gap-3">
        <Bone className="h-20 w-full rounded-2xl" />
        <Bone className="h-20 w-full rounded-2xl" />
        <Bone className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonSitesPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Bone className="h-4 w-20" />
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-28" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonSiteCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPassportPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Bone className="h-4 w-20" />
        <Bone className="h-8 w-32" />
      </div>
      <SkeletonPassportCard />
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
