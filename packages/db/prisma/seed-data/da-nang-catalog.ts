import { SiteCategory } from '@prisma/client';

export type CatalogSiteSeed = {
  slug: string;
  name: string;
  category: SiteCategory;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
  staticQrEnabled?: boolean;
};

/** ~30 POI catalog Đà Nẵng pilot — tọa độ gần đúng cho MVP */
export const DA_NANG_CATALOG_SITES: CatalogSiteSeed[] = [
  {
    slug: 'my-khe-beach',
    name: 'Bãi biển Mỹ Khê',
    category: SiteCategory.BEACH,
    latitude: 16.0471,
    longitude: 108.2462,
    address: 'Phường Mỹ An, quận Ngũ Hành Sơn',
  },
  {
    slug: 'non-nuoc-beach',
    name: 'Bãi biển Non Nước',
    category: SiteCategory.BEACH,
    latitude: 16.0012,
    longitude: 108.2634,
  },
  {
    slug: 'pham-van-dong-beach',
    name: 'Bãi biển Phạm Văn Đồng',
    category: SiteCategory.BEACH,
    latitude: 16.0688,
    longitude: 108.2438,
  },
  {
    slug: 'my-an-beach',
    name: 'Bãi biển Mỹ An',
    category: SiteCategory.BEACH,
    latitude: 16.0502,
    longitude: 108.2495,
  },
  {
    slug: 'bac-my-an-beach',
    name: 'Bãi Bắc Mỹ An',
    category: SiteCategory.BEACH,
    latitude: 16.042,
    longitude: 108.248,
  },
  {
    slug: 'marble-mountains',
    name: 'Ngũ Hành Sơn',
    category: SiteCategory.HERITAGE,
    latitude: 16.0034,
    longitude: 108.2634,
    description: 'Quần thể núi đá vôi với hang động và chùa chiền.',
    staticQrEnabled: true,
  },
  {
    slug: 'cham-sculpture-museum',
    name: 'Bảo tàng Điều khắc Chăm',
    category: SiteCategory.HERITAGE,
    latitude: 16.0603,
    longitude: 108.2208,
    address: '2 2 Tháng 9, Hải Châu',
  },
  {
    slug: 'dragon-bridge',
    name: 'Cầu Rồng',
    category: SiteCategory.CULTURAL,
    latitude: 16.0615,
    longitude: 108.2276,
  },
  {
    slug: 'thuan-phuoc-bridge',
    name: 'Cầu Thuận Phước',
    category: SiteCategory.CULTURAL,
    latitude: 16.0958,
    longitude: 108.2172,
  },
  {
    slug: 'love-bridge',
    name: 'Cầu Tình Yêu',
    category: SiteCategory.CULTURAL,
    latitude: 16.0618,
    longitude: 108.227,
  },
  {
    slug: 'linh-ung-son-tra',
    name: 'Chùa Linh Ứng - Bãi Bắc',
    category: SiteCategory.HERITAGE,
    latitude: 16.1,
    longitude: 108.2777,
  },
  {
    slug: 'son-tra-peninsula',
    name: 'Bán đảo Sơn Trà',
    category: SiteCategory.NATURE,
    latitude: 16.112,
    longitude: 108.3,
  },
  {
    slug: 'con-market',
    name: 'Chợ Cồn',
    category: SiteCategory.CULTURAL,
    latitude: 16.0684,
    longitude: 108.2202,
  },
  {
    slug: 'han-market',
    name: 'Chợ Hàn',
    category: SiteCategory.CULTURAL,
    latitude: 16.0681,
    longitude: 108.2235,
  },
  {
    slug: 'pink-church',
    name: 'Nhà thờ Con Gà',
    category: SiteCategory.HERITAGE,
    latitude: 16.0708,
    longitude: 108.2209,
  },
  {
    slug: 'danang-cathedral',
    name: 'Nhà thờ Chính tòa Đà Nẵng',
    category: SiteCategory.HERITAGE,
    latitude: 16.0706,
    longitude: 108.2208,
  },
  {
    slug: 'danang-museum',
    name: 'Bảo tàng Đà Nẵng',
    category: SiteCategory.CULTURAL,
    latitude: 16.0677,
    longitude: 108.2205,
  },
  {
    slug: 'fine-arts-museum',
    name: 'Bảo tàng Mỹ thuật Đà Nẵng',
    category: SiteCategory.CULTURAL,
    latitude: 16.0575,
    longitude: 108.2145,
  },
  {
    slug: 'apec-park',
    name: 'Công viên APEC',
    category: SiteCategory.CULTURAL,
    latitude: 16.0613,
    longitude: 108.2285,
  },
  {
    slug: 'east-sea-park',
    name: 'Công viên Biển Đông',
    category: SiteCategory.BEACH,
    latitude: 16.078,
    longitude: 108.242,
  },
  {
    slug: 'han-river-walk',
    name: 'Công viên bờ sông Hàn',
    category: SiteCategory.CULTURAL,
    latitude: 16.064,
    longitude: 108.225,
  },
  {
    slug: 'sun-wheel',
    name: 'Sun Wheel Đà Nẵng',
    category: SiteCategory.CULTURAL,
    latitude: 16.054,
    longitude: 108.232,
  },
  {
    slug: 'ba-na-hills',
    name: 'Khu du lịch Bà Nà Hills',
    category: SiteCategory.MOUNTAIN,
    latitude: 15.9953,
    longitude: 107.9969,
  },
  {
    slug: 'thien-thai-mountain',
    name: 'Núi Thần Tài',
    category: SiteCategory.MOUNTAIN,
    latitude: 16.0089,
    longitude: 108.1428,
  },
  {
    slug: 'hoang-sa-exhibition',
    name: 'Triển lãm Hoàng Sa',
    category: SiteCategory.CULTURAL,
    latitude: 16.077,
    longitude: 108.238,
  },
  {
    slug: 'seafood-street',
    name: 'Phố hải sản Nại Nam',
    category: SiteCategory.FOOD,
    latitude: 16.052,
    longitude: 108.235,
  },
  {
    slug: 'cam-ne-mat-village',
    name: 'Làng nghề Cẩm Ne',
    category: SiteCategory.CULTURAL,
    latitude: 16.05,
    longitude: 108.19,
  },
  {
    slug: 'tien-sa-port',
    name: 'Cảng Tiên Sa',
    category: SiteCategory.CULTURAL,
    latitude: 16.0985,
    longitude: 108.235,
  },
  {
    slug: 'nam-o-beach',
    name: 'Bãi biển Nam Ô',
    category: SiteCategory.BEACH,
    latitude: 16.118,
    longitude: 108.212,
  },
  {
    slug: 'xuan-thieu-beach',
    name: 'Bãi biển Xuân Thiều',
    category: SiteCategory.BEACH,
    latitude: 16.105,
    longitude: 108.255,
  },
];
