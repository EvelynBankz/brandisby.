import type { Metadata } from "next";
import { creatorsService } from "@/services/creators";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { EntityCard } from "@/components/marketing/entity-card";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Creators — Brandisby",
  description: "Creators making content worth following.",
};

export default async function CreatorsPage() {
  const creators = await creatorsService.list();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <PageHeader title="Creators" description="Creators worth following." />
          <div className="mt-8">
            {creators.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {creators.map((creator) => (
                  <EntityCard
                    key={creator.id}
                    href={`/creators/${creator.slug}`}
                    imageUrl={creator.photoUrl}
                    imageShape="circle"
                    title={creator.name}
                    subtitle={creator.tagline}
                    meta={creator.location}
                    ctaLabel="View profile"
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Creator profiles are coming soon" />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
