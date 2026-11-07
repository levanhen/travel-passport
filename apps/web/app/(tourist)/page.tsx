'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SkeletonHomePage } from '@/app/_components/skeleton';
import { PassportCard } from '@/app/(tourist)/_components/passport-card';
import { QuickActionTile } from '@/app/(tourist)/_components/quick-action-tile';
import {
  getAccessToken,
  getStoredPhone,
  logout,
  touristStartRaw,
  TouristUser,
} from '@/app/(tourist)/_lib/auth';
import { usePointsSummary } from '@/app/(tourist)/_lib/queries';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<TouristUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  const { data: summary } = usePointsSummary(!!user);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (getAccessToken()) {
          const { fetchMe } = await import('@/app/(tourist)/_lib/auth');
          const me = await fetchMe();
          if (!cancelled) {
            if (me) setUser(me);
            else router.replace('/auth/start');
          }
          return;
        }
        const phone = getStoredPhone();
        if (phone) {
          const result = await touristStartRaw(phone);
          if (cancelled) return;
          if (result.kind === 'session') {
            setUser(result.session.user);
            return;
          }
          if (result.kind === 'unlock') {
            router.replace(`/auth/unlock?phone=${encodeURIComponent(phone)}`);
            return;
          }
          if (result.kind === 'set_pin') {
            router.replace(`/auth/set-pin?phone=${encodeURIComponent(phone)}`);
            return;
          }
        }
        router.replace('/auth/start');
      } catch {
        if (!cancelled) setBootError('Không kết nối được API. Kiểm tra apps/api.');
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogout() {
    await logout();
    router.replace('/auth/start');
  }

  if (booting) {
    return <SkeletonHomePage />;
  }

  if (bootError) {
    return (
      <div>
        <p className="tp-alert-error">{bootError}</p>
        <Link href="/auth/start" className="tp-link mt-4 inline-block text-sm">
          Thử đăng nhập
        </Link>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ocean to-primary p-5 text-white shadow-card">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-8 right-8 h-16 w-16 rounded-full bg-white/10" aria-hidden />
        <p className="text-sm font-medium text-sky-100">Đà Nẵng Pilot</p>
        <h1 className="mt-1 text-2xl font-bold">
          Xin chào, {user.profile?.displayName ?? 'Khách'}
        </h1>
        <p className="mt-1 text-sm text-sky-100/90">{user.phone}</p>
        <Link
          href="/profile"
          className="mt-3 inline-block text-sm font-medium text-white underline-offset-2 hover:underline"
        >
          Hồ sơ →
        </Link>
      </header>

      {summary ? (
        <PassportCard summary={summary} />
      ) : (
        <div className="tp-passport-card animate-pulse p-5">
          <div className="h-4 w-24 rounded bg-white/60" />
          <div className="mt-3 h-10 w-32 rounded bg-white/60" />
        </div>
      )}

      <Link
        href="/check-in/here"
        className="tp-card-interactive tp-pressable flex items-center gap-4 bg-gradient-to-br from-primary to-ocean p-4 text-white shadow-card"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">
          📍
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">Check-in tại đây</p>
          <p className="mt-0.5 text-sm text-sky-100">
            GPS tìm điểm gần bạn — không cần quét QR
          </p>
        </div>
        <span className="text-xl text-white/70" aria-hidden>
          →
        </span>
      </Link>

      <div className="grid gap-3">
        <QuickActionTile
          href="/sites"
          variant="sites"
          icon="🗺️"
          title="Điểm du lịch"
          description="Khám phá và check-in tại các điểm đến"
        />
        <QuickActionTile
          href="/passport"
          variant="passport"
          icon="🛂"
          title="Passport của tôi"
          description="Điểm, badge và lịch sử check-in"
        />
        <QuickActionTile
          href="/vouchers"
          variant="vouchers"
          icon="🎫"
          title="Ưu đãi"
          description="Voucher từ đối tác địa phương"
        />
      </div>

      <div className="flex justify-end border-t border-border/60 pt-4">
        <button type="button" className="tp-btn tp-btn-ghost text-sm" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
