import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EntityCardProps {
  href: string;
  imageUrl?: string;
  imageShape?: "cover" | "circle";
  title: string;
  subtitle?: string;
  meta?: string;
  ctaLabel?: string;
}

function EntityCard({
  href,
  imageUrl,
  imageShape = "cover",
  title,
  subtitle,
  meta,
  ctaLabel = "View",
}: EntityCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div
        className={cn(
          "w-full overflow-hidden bg-surface-muted",
          imageShape === "circle" ? "aspect-square p-6" : "aspect-[4/3]",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
          <img
            src={imageUrl}
            alt={title}
            className={cn(
              "size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
              imageShape === "circle" && "rounded-full",
            )}
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="font-serif text-lg text-foreground">{title}</span>
        {subtitle ? <span className="text-sm text-foreground-muted">{subtitle}</span> : null}
        {meta ? <span className="text-xs text-foreground-muted">{meta}</span> : null}
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
          {ctaLabel}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export { EntityCard };
