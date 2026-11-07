'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SiteCover } from '@/app/(tourist)/_components/site-cover';
import { fetchCheckins, CheckinListItem } from '@/app/(tourist)/_lib/check-in';
import {
  findTodayCheckinForSite,
  upgradeLinkForCheckin,
} from '@/app/(tourist)/_lib/check-in-status';
import { categoryLabel, fetchSite, Site } from '@/app/(tourist)/_lib/sites';

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const siteId = params.id;

  const [site, setSite] = useState<Site | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<CheckinListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, checkins] = await Promise.all([fetchSite(siteId), fetchCheckins()]);
        if (!cancelled) {
          setSite(data);
          setTodayCheckin(findTodayCheckinForSite(checkins, siteId));
        }
      } catch {
        if (!cancelled) setError('Không tìm thấy điểm này hoặc API chưa sẵn sàng.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  if (loading) {
    return <p className="text-muted">Đang tải…</p>;
  }

  if (error || !site) {
    return (
      <div className="space-y-4">
        <p className="tp-alert-error">{error ?? 'Không tìm thấy.'}</p>
        <Link href="/sites" className="tp-link text-sm">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const upgradeLink = todayCheckin ? upgradeLinkForCheckin(todayCheckin) : null;

  return (
    <div className="space-y-6">
      <div className="-mx-4 -mt-4 overflow-hidden rounded-b-3xl shadow-card">
        <SiteCover name={site.name} category={site.category} slug={site.slug} aspect="hero">
          <Link
            href="/sites"
            className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-black/40"
          >
            ← Danh sách
          </Link>
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                {categoryLabel(site.category)}
              </span>
              {site.participationLevel === 'partner' && (
                <span className="rounded-full bg-primary/80 px-2 py-0.5 text-xs font-medium">
                  Đối tác
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight">{site.name}</h1>
            {site.address && <p className="mt-1 text-sm text-white/85">{site.address}</p>}
          </div>
        </SiteCover>
      </div>

      {site.description && (
        <p className="text-sm leading-relaxed text-gray-700">{site.description}</p>
      )}

      {site.operatorName && (
        <p className="text-sm text-muted">Vận hành: {site.operatorName}</p>
      )}

      {todayCheckin && (
        <div className="rounded-2xl border border-primary/20 bg-sky-50/80 p-4">
          <p className="font-semibold text-primary">Đã check-in hôm nay</p>
          <p className="mt-1 text-sm text-muted">
            {todayCheckin.proofLevel} · +{todayCheckin.pointsAwarded} điểm
          </p>
          {upgradeLink && (
            <Link href={upgradeLink} className="tp-btn tp-btn-secondary mt-3 w-full text-sm">
              Nâng cấp bằng chứng
            </Link>
          )}
        </div>
      )}

      <div className="border-t border-border/60 pt-4">
        {todayCheckin ? (
          <Link href="/passport/check-ins" className="tp-btn tp-btn-secondary w-full">
            Xem lịch sử check-in
          </Link>
        ) : (
          <Link href={`/sites/${site.id}/check-in`} className="tp-btn tp-btn-primary w-full">
            Check-in tại đây
          </Link>
        )}
        <p className="mt-2 text-center text-xs text-muted">
          {todayCheckin
            ? 'Mỗi điểm chỉ check-in một lần mỗi ngày.'
            : 'Check-in bằng GPS khi đến nơi · Chụp ảnh hoặc QR để thêm điểm (tuỳ chọn)'}
        </p>
      </div>
    </div>
  );
}
