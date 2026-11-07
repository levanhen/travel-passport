import Image from 'next/image';
import { categoryGradient, getSiteCoverUrl } from '@/app/(tourist)/_lib/site-images';
import { categoryLabel } from '@/app/(tourist)/_lib/sites';

type SiteCoverProps = {
  name: string;
  category: string;
  slug?: string;
  aspect?: 'card' | 'hero';
  className?: string;
  children?: React.ReactNode;
};

export function SiteCover({
  name,
  category,
  slug,
  aspect = 'card',
  className = '',
  children,
}: SiteCoverProps) {
  const height = aspect === 'hero' ? 'h-52' : 'h-36';
  const src = getSiteCoverUrl(category, slug);

  return (
    <div className={`relative overflow-hidden ${height} ${className}`}>
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        sizes={aspect === 'hero' ? '480px' : '400px'}
        loading={aspect === 'hero' ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCBmaWxsPSIjZDJlOGYwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${categoryGradient(category)} opacity-40 mix-blend-multiply`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {children}
      {aspect === 'card' && (
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-800 backdrop-blur-sm">
            {categoryLabel(category)}
          </span>
        </div>
      )}
    </div>
  );
}
