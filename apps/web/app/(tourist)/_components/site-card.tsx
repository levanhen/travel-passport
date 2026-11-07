import Link from 'next/link';
import { SiteCover } from './site-cover';
import { Site } from '@/app/(tourist)/_lib/sites';

export function SiteCard({ site }: { site: Site }) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="tp-card-interactive block overflow-hidden p-0"
    >
      <SiteCover name={site.name} category={site.category} slug={site.slug} aspect="card" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">{site.name}</p>
            {site.address && (
              <p className="mt-1 truncate text-sm text-muted">{site.address}</p>
            )}
          </div>
        </div>
        {site.participationLevel === 'partner' && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ocean">
            <span aria-hidden>⌖</span> Check-in QR tại quầy
          </p>
        )}
        {site.participationLevel === 'catalog' && site.staticQrEnabled && (
          <p className="mt-2 text-xs text-muted">GPS + QR tùy chọn</p>
        )}
      </div>
    </Link>
  );
}
