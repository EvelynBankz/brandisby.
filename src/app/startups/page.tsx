import type { Metadata } from "next";
import { startupsService } from "@/services/startups";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { EntityCard } from "@/components/marketing/entity-card";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Startups — Brandisby",
  description: "Emerging startups shaping Nigeria.",
};

export default async function StartupsPage() {
  const startups = await startupsService.list();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <PageHeader title="Startups" description="Emerging startups worth knowing." />
          <div className="mt-8">
            {startups.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {startups.map((startup) => (
                  <EntityCard
                    key={startup.id}
                    href={`/startups/${startup.slug}`}
                    imageUrl={startup.coverImageUrl}
                    title={startup.name}
                    subtitle={startup.tagline}
                    meta={startup.location}
                    ctaLabel="View startup"
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Startup profiles are coming soon" />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
