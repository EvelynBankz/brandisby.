import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Rocket, Users } from "lucide-react";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SectionHeading } from "@/components/marketing/section-heading";
import { BrandCard } from "@/components/marketing/brand-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

// Minimizes Firestore reads for a content site that doesn't change every
// second — see brief's performance notes on avoiding excessive reads.
export const revalidate = 300;

export default async function HomePage() {
  const [featured, newest, trending, categories] = await Promise.all([
    brandsService.getFeatured(),
    brandsService.getNewest(),
    brandsService.getTrending(),
    categoriesService.list(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="border-b border-border bg-surface-muted">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:py-28">
            <h1 className="max-w-2xl font-serif text-4xl leading-tight text-foreground sm:text-6xl">
              Discover the brands shaping Nigeria.
            </h1>
            <p className="max-w-xl text-lg text-foreground-muted">
              Explore emerging businesses, founder stories, creators, startups, and
              brands worth knowing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/discover">Discover Brands</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/get-featured">Get Featured</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Brands */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <SectionHeading
            kicker="Featured"
            title="Brands worth knowing"
            action={
              <Button asChild variant="ghost">
                <Link href="/discover">
                  View all <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <div className="mt-8">
            {featured.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Sparkles className="size-6" />}
                title="No featured brands yet"
                description="Check back soon — we're curating our first picks."
              />
            )}
          </div>
        </section>

        {/* New & Noteworthy */}
        <section className="border-t border-border bg-surface-muted/50">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <SectionHeading kicker="New" title="New & noteworthy" />
            <div className="mt-8">
              {newest.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {newest.map((brand) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Nothing new just yet" />
              )}
            </div>
          </div>
        </section>

        {/* Startup Spotlight — placeholder until the startups collection/service exists (M4) */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <SectionHeading kicker="Startups" title="Startup spotlight" />
          <div className="mt-8">
            <EmptyState
              icon={<Rocket className="size-6" />}
              title="Startup profiles are coming soon"
              description="We're building out startup spotlights next."
            />
          </div>
        </section>

        {/* Founder Stories — placeholder until the founders collection/service exists (M4) */}
        <section className="border-t border-border bg-surface-muted/50">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <SectionHeading kicker="Founders" title="Founder stories" />
            <div className="mt-8">
              <EmptyState
                icon={<BookOpen className="size-6" />}
                title="Founder stories are coming soon"
                description="Real stories from the people building these brands."
              />
            </div>
          </div>
        </section>

        {/* Trending Brands */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <SectionHeading kicker="Trending" title="Trending brands" />
          <div className="mt-8">
            {trending.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {trending.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            ) : (
              <EmptyState title="No trending brands yet" />
            )}
          </div>
        </section>

        {/* Browse by Category */}
        <section className="border-t border-border bg-surface-muted/50">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <SectionHeading kicker="Browse" title="Browse by category" align="center" />
            <div className="mt-8">
              {categories.length ? (
                <div className="flex flex-wrap justify-center gap-3">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="Categories are being set up" />
              )}
            </div>
          </div>
        </section>

        {/* What People Are Saying — never fabricated; empty until real, attributed quotes exist */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <SectionHeading kicker="Voices" title="What people are saying" align="center" />
          <div className="mt-8">
            <EmptyState title="No quotes yet" description="Real, attributed quotes will appear here." />
          </div>
        </section>

        {/* Latest from the Journal — placeholder until the articles collection/service exists (M5) */}
        <section className="border-t border-border bg-surface-muted/50">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <SectionHeading
              kicker="Journal"
              title="Latest from the journal"
              action={
                <Button asChild variant="ghost">
                  <Link href="/journal">
                    View all <ArrowRight className="size-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-8">
              <EmptyState icon={<BookOpen className="size-6" />} title="The journal is coming soon" />
            </div>
          </div>
        </section>

        {/* Creator Spotlight — placeholder until the creators collection/service exists (M4) */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <SectionHeading kicker="Creators" title="Creator spotlight" />
          <div className="mt-8">
            <EmptyState icon={<Users className="size-6" />} title="Creator profiles are coming soon" />
          </div>
        </section>

        {/* Get Featured CTA */}
        <section className="border-t border-border bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="font-serif text-3xl">Building something worth knowing?</h2>
              <p className="max-w-md text-primary-foreground/70">
                Tell us about your brand, startup, or story.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href="/get-featured">Apply to Get Featured</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
