const VN_TZ = 'Asia/Ho_Chi_Minh';

/** Date-only for cooldown key (VN local calendar day). */
export function getLocalDateVN(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
}

export function getUpgradeWindowMinutes(): number {
  const raw = process.env.CHECKIN_UPGRADE_WINDOW_MINUTES;
  const n = raw ? Number(raw) : 30;
  return Number.isFinite(n) && n > 0 ? n : 30;
}
