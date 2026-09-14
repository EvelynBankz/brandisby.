import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, ExternalLink } from "lucide-react";
import { startupsService } from "@/services/startups";
import { categoriesService } from "@/services/categories";
import { foundersService } from "@/services/founders";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

interface StartupProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StartupProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const startup = await startupsService.getBySlug(slug);
  if (!startup || startup.status !== "published") return {};

  return {
    title: `${startup.name} — Brandisby`,
    description: startup.tagline ?? startup.description,
  };
}

export default async function StartupProfilePage({ params }: StartupProfilePageProps) {
  const { slug } = await params;
  const startup = await startupsService.getBySlug(slug);
  if (!startup || startup.status !== "published") notFound();

  const [categories, founders] = await Promise.all([
    categoriesService.list(),
    foundersService.getByIds(startup.founderIds ?? []),
  ]);
  const startupCategories = categories.filter((category) =>
    startup.categoryIds.includes(category.id),
  );

  const links = [
    startup.websiteUrl && { label: "Website", href: startup.websiteUrl, icon: Globe },
    startup.instagramUrl && { label: "Instagram", href: startup.instagramUrl, icon: ExternalLink },
    startup.xUrl && { label: "X", href: startup.xUrl, icon: ExternalLink },
    startup.linkedinUrl && { label: "LinkedIn", href: startup.linkedinUrl, icon: ExternalLink },
  ].filter(Boolean) as { label: string; href: string; icon: typeof Globe }[];

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-border bg-surface-muted">
          <div className="mx-auto aspect-[21/9] w-full max-w-6xl overflow-hidden bg-surface">
            {startup.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
              <img src={startup.coverImageUrl} alt="" className="size-full object-cover" />
            ) : null}
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-6 py-12">
          <div className="flex flex-col gap-4">
            {startup.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
              <img
                src={startup.logoUrl}
                alt={`${startup.name} logo`}
                className="size-16 rounded-full border border-border object-cover"
              />
            ) : null}

            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-4xl text-foreground">{startup.name}</h1>
              {startup.tagline ? (
                <p className="text-lg text-foreground-muted">{startup.tagline}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                {startup.location ? <span>{startup.location}</span> : null}
                {startupCategories.map((category) => (
                  <Link key={category.id} href={`/categories/${category.slug}`}>
                    <Badge variant="outline">{category.name}</Badge>
                  </Link>
                ))}
              </div>
            </div>

            {links.length ? (
              <div className="flex flex-wrap gap-3 pt-2">
                {links.map((link) => (
                  <Button key={link.label} asChild variant="secondary" size="sm">
                    <a href={link.href} target="_blank" rel="noreferrer">
                      <link.icon className="size-4" />
                      {link.label}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-10 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="font-serif text-2xl text-foreground">About</h2>
              <p className="whitespace-pre-line text-foreground-muted">
                {startup.description}
              </p>
            </div>

            {startup.story ? (
              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-2xl text-foreground">The story</h2>
                <p className="whitespace-pre-line text-foreground-muted">{startup.story}</p>
              </div>
            ) : null}

            {founders.length ? (
              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-2xl text-foreground">Founders</h2>
                <div className="flex flex-wrap gap-2">
                  {founders.map((founder) => (
                    <Link
                      key={founder.id}
                      href={`/founders/${founder.slug}`}
                      className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted"
                    >
                      {founder.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
