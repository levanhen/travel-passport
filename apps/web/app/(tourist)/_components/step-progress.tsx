type StepProgressProps = {
  current: 1 | 2 | 3;
  labels?: [string, string, string];
};

const DEFAULT_LABELS: [string, string, string] = ['GPS', 'Check-in', 'Ảnh (tuỳ chọn)'];

export function StepProgress({ current, labels = DEFAULT_LABELS }: StepProgressProps) {
  const steps = [1, 2, 3] as const;

  return (
    <div className="flex items-center gap-1" aria-label="Tiến trình check-in">
      {steps.map((step, index) => {
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-primary text-white'
                    : active
                      ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                      : 'bg-gray-100 text-muted'
                }`}
              >
                {done ? '✓' : step}
              </span>
              <span
                className={`max-w-full truncate text-center text-[10px] font-medium leading-tight ${
                  active ? 'text-primary' : 'text-muted'
                }`}
              >
                {labels[index]}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-full max-w-[24px] shrink ${
                  step < current ? 'bg-primary' : 'bg-gray-200'
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
