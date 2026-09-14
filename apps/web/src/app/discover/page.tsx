import Link from "next/link";
import type { Metadata } from "next";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { BrandCard } from "@/components/marketing/brand-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Discover — Brandisby",
  description: "Browse the brands, startups, and creators shaping Nigeria.",
};

interface DiscoverPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    featured?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const featured = params.featured === "true";

  const [brands, categories] = await Promise.all([
    brandsService.search({
      q: params.q,
      categoryId: params.category,
      location: params.location,
      featured,
      max: 60,
    }),
    categoriesService.list(),
  ]);

  const hasFilters = Boolean(params.q || params.category || params.location || featured);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <PageHeader
            title="Discover"
            description="Browse brands. Filter by category or location, or search by name."
          />

          {/* Deliberately V1: search, category, location, featured — no
              pagination or advanced sort yet, per the brief's "do not
              overbuild filters initially." Plain GET form so filtering works
              without client JS. */}
          <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
            <div className="flex min-w-[220px] flex-1 flex-col gap-1">
              <label htmlFor="q" className="text-xs font-medium text-foreground-muted">
                Search
              </label>
              <Input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Search brands…" />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="category"
                className="text-xs font-medium text-foreground-muted"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={params.category ?? ""}
                className="h-10 rounded-md border border-input bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="location"
                className="text-xs font-medium text-foreground-muted"
              >
                Location
              </label>
              <Input
                id="location"
                name="location"
                defaultValue={params.location ?? ""}
                placeholder="e.g. Lagos"
                className="w-40"
              />
            </div>

            <label className="flex h-10 items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="featured"
                value="true"
                defaultChecked={featured}
                className="size-4 accent-primary"
              />
              Featured only
            </label>

            <Button type="submit">Apply filters</Button>
            {hasFilters ? (
              <Button asChild variant="ghost">
                <Link href="/discover">Clear</Link>
              </Button>
            ) : null}
          </form>

          <div className="mt-8">
            {brands.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {brands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No brands match those filters"
                description="Try a broader search or clear your filters."
              />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
