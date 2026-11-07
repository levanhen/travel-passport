/** Cover images for pilot sites — Unsplash (demo). Replace with API coverObjectKey later. */

const SLUG_IMAGES: Record<string, string> = {
  'my-khe-beach': 'photo-1559827260-dc66d52bef19',
  'dragon-bridge': 'photo-1583417313050-5a4e4fbb0de1',
  'dragon-bridge-partner': 'photo-1583417313050-5a4e4fbb0de1',
  'marble-mountains': 'photo-1596422846543-75c6fc558fec',
  'marble-mountains-partner': 'photo-1596422846543-75c6fc558fec',
  'cham-sculpture-museum': 'photo-1565008576549-57569a49371d',
  'cham-museum-partner': 'photo-1565008576549-57569a49371d',
  'son-tra-peninsula': 'photo-1507525428034-b723cf961d3e',
  'ba-na-hills': 'photo-1464822759023-fed622ff2c3b',
  'linh-ung-pagoda': 'photo-1548013146-72479768bada',
};

const CATEGORY_IMAGES: Record<string, string> = {
  BEACH: 'photo-1507525428034-b723cf961d3e',
  HERITAGE: 'photo-1528181304800-259b08848526',
  NATURE: 'photo-1506905925346-21bda4d32df4',
  MOUNTAIN: 'photo-1464822759023-fed622ff2c3b',
  ISLAND: 'photo-1559827260-dc66d52bef19',
  CULTURAL: 'photo-1528127269322-539801943592',
  FOOD: 'photo-1555939594-58d7cb561ad1',
  OTHER: 'photo-1488646953014-85cb44e25828',
};

export function getSiteCoverUrl(category: string, slug?: string): string {
  const photoId =
    (slug && SLUG_IMAGES[slug]) ?? CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.OTHER;
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=960&q=80`;
}

export const CATEGORY_GRADIENT: Record<string, string> = {
  BEACH: 'from-sky-500 to-cyan-600',
  HERITAGE: 'from-amber-700 to-orange-800',
  NATURE: 'from-emerald-600 to-teal-700',
  MOUNTAIN: 'from-slate-600 to-slate-800',
  ISLAND: 'from-blue-500 to-indigo-600',
  CULTURAL: 'from-violet-600 to-purple-700',
  FOOD: 'from-orange-500 to-red-600',
  OTHER: 'from-primary to-ocean-dark',
};

export function categoryGradient(category: string): string {
  return CATEGORY_GRADIENT[category] ?? CATEGORY_GRADIENT.OTHER;
}
