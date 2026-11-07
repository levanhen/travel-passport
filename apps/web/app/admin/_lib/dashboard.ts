import { apiFetch } from './api';
import { getAccessToken } from './auth';

export type DashboardRecentCheckIn = {
  id: string;
  siteName: string;
  checkedInAt: string;
  userPhoneMasked: string | null;
  proofLevel: string;
  status: string;
};

export type AdminDashboard = {
  role: string;
  destinationName: string;
  organizationName: string | null;
  sites: {
    total: number;
    catalog: number;
    partner: number;
    published: number;
  };
  merchantsActive: number;
  badgesPublished: number;
  checkInsToday: number;
  checkIns7Days: number;
  recentCheckIns: DashboardRecentCheckIn[];
};

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const res = await apiFetch<{ data: AdminDashboard }>('/admin/dashboard', {
    accessToken: getAccessToken(),
  });
  return res.data;
}
