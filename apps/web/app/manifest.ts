import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tourism Passport — Đà Nẵng',
    short_name: 'Passport',
    description: 'Check-in du lịch, tích điểm và đổi ưu đãi tại Đà Nẵng',
    start_url: '/',
    display: 'standalone',
    background_color: '#e0f2fe',
    theme_color: '#0891b2',
    orientation: 'portrait',
    lang: 'vi',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
