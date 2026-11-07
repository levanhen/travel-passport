/** Pilot badge visuals — fallback when API `iconUrl` is null. */

export type BadgeVisual = {
  emoji: string;
  gradient: string;
  ring: string;
};

const BADGE_VISUALS: Record<string, BadgeVisual> = {
  'first-step': {
    emoji: '👣',
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-200',
  },
  'first-checkin-da-nang': {
    emoji: '👣',
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-200',
  },
  'da-nang-explorer': {
    emoji: '🗺️',
    gradient: 'from-sky-500 to-cyan-600',
    ring: 'ring-sky-200',
  },
  'heritage-explorer': {
    emoji: '🏛️',
    gradient: 'from-amber-600 to-orange-700',
    ring: 'ring-amber-200',
  },
  'beach-lover': {
    emoji: '🏖️',
    gradient: 'from-blue-400 to-cyan-500',
    ring: 'ring-blue-200',
  },
  'verified-traveller': {
    emoji: '🛡️',
    gradient: 'from-violet-500 to-indigo-600',
    ring: 'ring-violet-200',
  },
};

const DEFAULT_VISUAL: BadgeVisual = {
  emoji: '🏅',
  gradient: 'from-primary to-ocean-dark',
  ring: 'ring-primary/25',
};

export function getBadgeVisual(slug: string): BadgeVisual {
  return BADGE_VISUALS[slug] ?? DEFAULT_VISUAL;
}
