import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Tourism Passport',
    template: '%s · Tourism Passport',
  },
  description: 'Check-in du lịch, tích điểm và đổi ưu đãi — Đà Nẵng Pilot',
  applicationName: 'Tourism Passport',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Passport',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
