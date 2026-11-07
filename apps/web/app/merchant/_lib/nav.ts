export type MerchantRole = 'merchant_owner' | 'merchant_staff';

export type MerchantDesktopLink = {
  href: string;
  label: string;
  roles: MerchantRole[];
};

export const MERCHANT_DESKTOP_LINKS: MerchantDesktopLink[] = [
  { href: '/merchant', label: 'Dashboard', roles: ['merchant_owner'] },
  { href: '/merchant/redeem', label: 'Quét voucher', roles: ['merchant_owner', 'merchant_staff'] },
  { href: '/merchant/vouchers', label: 'Ưu đãi', roles: ['merchant_owner'] },
  { href: '/merchant/history', label: 'Lịch sử', roles: ['merchant_owner', 'merchant_staff'] },
  { href: '/merchant/staff', label: 'Nhân viên', roles: ['merchant_owner'] },
  { href: '/merchant/profile', label: 'Hồ sơ', roles: ['merchant_owner', 'merchant_staff'] },
];

export type MerchantMobileTab = {
  href: string;
  label: string;
  roles: MerchantRole[];
  emphasis?: boolean;
  match: (pathname: string) => boolean;
};

export const MERCHANT_MOBILE_TABS: MerchantMobileTab[] = [
  {
    href: '/merchant',
    label: 'Trang chủ',
    roles: ['merchant_owner'],
    match: (p) => p === '/merchant',
  },
  {
    href: '/merchant/redeem',
    label: 'Quét',
    roles: ['merchant_owner', 'merchant_staff'],
    emphasis: true,
    match: (p) => p.startsWith('/merchant/redeem'),
  },
  {
    href: '/merchant/vouchers',
    label: 'Ưu đãi',
    roles: ['merchant_owner'],
    match: (p) => p.startsWith('/merchant/vouchers'),
  },
  {
    href: '/merchant/history',
    label: 'Lịch sử',
    roles: ['merchant_owner', 'merchant_staff'],
    match: (p) =>
      p.startsWith('/merchant/history') ||
      p.startsWith('/merchant/staff') ||
      p.startsWith('/merchant/profile') ||
      p.startsWith('/merchant/settings'),
  },
  {
    href: '/merchant/profile',
    label: 'Hồ sơ',
    roles: ['merchant_staff'],
    match: (p) => p.startsWith('/merchant/profile') || p.startsWith('/merchant/settings'),
  },
];

export function navLinksForRole(role: string): MerchantDesktopLink[] {
  return MERCHANT_DESKTOP_LINKS.filter((link) => link.roles.includes(role as MerchantRole));
}

export function mobileTabsForRole(role: string): MerchantMobileTab[] {
  return MERCHANT_MOBILE_TABS.filter((tab) => tab.roles.includes(role as MerchantRole));
}

export function defaultMerchantHome(role: string): string {
  return role === 'merchant_staff' ? '/merchant/redeem' : '/merchant';
}

export function isOwnerOnlyPath(pathname: string): boolean {
  if (pathname === '/merchant') return true;
  if (pathname.startsWith('/merchant/vouchers')) return true;
  if (pathname.startsWith('/merchant/staff')) return true;
  return false;
}
