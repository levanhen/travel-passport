import { TouristLevel } from '@tp/db';

const LEVEL_THRESHOLDS: Record<TouristLevel, number> = {
  TRAVELLER: 0,
  EXPLORER: 500,
  LOCAL_INSIDER: 2000,
};

const LEVEL_LABELS: Record<TouristLevel, string> = {
  TRAVELLER: 'Traveller',
  EXPLORER: 'Explorer',
  LOCAL_INSIDER: 'Local Insider',
};

export function levelRank(level: TouristLevel): number {
  switch (level) {
    case TouristLevel.TRAVELLER:
      return 0;
    case TouristLevel.EXPLORER:
      return 1;
    case TouristLevel.LOCAL_INSIDER:
      return 2;
    default:
      return 0;
  }
}

export function meetsMinLevel(userLevel: TouristLevel, minLevel: TouristLevel): boolean {
  return levelRank(userLevel) >= levelRank(minLevel);
}

export function levelLabel(level: TouristLevel): string {
  return LEVEL_LABELS[level] ?? level;
}

export function pointsToNextLevel(balance: number): {
  nextLevel: TouristLevel | null;
  pointsToNextLevel: number;
} {
  if (balance < LEVEL_THRESHOLDS.EXPLORER) {
    return { nextLevel: TouristLevel.EXPLORER, pointsToNextLevel: LEVEL_THRESHOLDS.EXPLORER - balance };
  }
  if (balance < LEVEL_THRESHOLDS.LOCAL_INSIDER) {
    return {
      nextLevel: TouristLevel.LOCAL_INSIDER,
      pointsToNextLevel: LEVEL_THRESHOLDS.LOCAL_INSIDER - balance,
    };
  }
  return { nextLevel: null, pointsToNextLevel: 0 };
}
