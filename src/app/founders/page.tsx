import type { Metadata } from "next";
import { foundersService } from "@/services/founders";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { EntityCard } from "@/components/marketing/entity-card";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Founders — Brandisby",
  description: "Stories from the people building Nigeria's brands.",
};

export default async function FoundersPage() {
  const founders = await foundersService.list();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <PageHeader title="Founders" description="The people building these brands." />
          <div className="mt-8">
            {founders.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {founders.map((founder) => (
                  <EntityCard
                    key={founder.id}
                    href={`/founders/${founder.slug}`}
                    imageUrl={founder.photoUrl}
                    imageShape="circle"
                    title={founder.name}
                    subtitle={founder.role}
                    meta={founder.location}
                    ctaLabel="Read their story"
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Founder stories are coming soon" />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
