import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Brand } from "@/services/brands";

export interface BrandCardProps {
  brand: Brand;
}

function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {brand.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
          <img
            src={brand.coverImageUrl}
            alt={brand.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="font-serif text-lg text-foreground">{brand.name}</span>
        {brand.tagline ? (
          <span className="text-sm text-foreground-muted">{brand.tagline}</span>
        ) : null}
        {brand.location ? (
          <span className="text-xs text-foreground-muted">{brand.location}</span>
        ) : null}
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
          View brand
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export { BrandCard };
