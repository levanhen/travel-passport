export type BoRole = 'site_operator' | 'authority_admin' | 'platform_admin';

export type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  roles: BoRole[];
};

export const BO_NAV_LINKS: NavLink[] = [
  { href: '/admin', label: 'Dashboard', exact: true, roles: ['authority_admin', 'platform_admin'] },
  { href: '/admin/sites', label: 'Sites', roles: ['site_operator', 'authority_admin', 'platform_admin'] },
  { href: '/admin/badges', label: 'Badges', roles: ['authority_admin', 'platform_admin'] },
  { href: '/admin/merchants', label: 'Merchants', roles: ['authority_admin', 'platform_admin'] },
  { href: '/admin/users', label: 'Users', roles: ['platform_admin'] },
  { href: '/admin/profile', label: 'Profile', roles: ['site_operator', 'authority_admin', 'platform_admin'] },
];

export function navLinksForRole(role: string): NavLink[] {
  return BO_NAV_LINKS.filter((link) => link.roles.includes(role as BoRole));
}

export function isAuthorityRole(role: string): boolean {
  return role === 'authority_admin' || role === 'platform_admin';
}

export function defaultAdminHome(role: string): string {
  return role === 'site_operator' ? '/admin/sites' : '/admin';
}
