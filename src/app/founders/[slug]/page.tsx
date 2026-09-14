import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, ExternalLink } from "lucide-react";
import { foundersService } from "@/services/founders";
import { brandsService } from "@/services/brands";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

interface FounderProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: FounderProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const founder = await foundersService.getBySlug(slug);
  if (!founder || founder.status !== "published") return {};

  return {
    title: `${founder.name} — Brandisby`,
    description: founder.role ?? founder.bio,
  };
}

export default async function FounderProfilePage({ params }: FounderProfilePageProps) {
  const { slug } = await params;
  const founder = await foundersService.getBySlug(slug);
  if (!founder || founder.status !== "published") notFound();

  const brands = await brandsService.getByIds(founder.brandIds ?? []);

  const links = [
    founder.websiteUrl && { label: "Website", href: founder.websiteUrl, icon: Globe },
    founder.instagramUrl && { label: "Instagram", href: founder.instagramUrl, icon: ExternalLink },
    founder.xUrl && { label: "X", href: founder.xUrl, icon: ExternalLink },
    founder.linkedinUrl && { label: "LinkedIn", href: founder.linkedinUrl, icon: ExternalLink },
  ].filter(Boolean) as { label: string; href: string; icon: typeof Globe }[];

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-4xl px-6 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="size-28 overflow-hidden rounded-full border border-border bg-surface-muted">
              {founder.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
                <img
                  src={founder.photoUrl}
                  alt={founder.name}
                  className="size-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-4xl text-foreground">{founder.name}</h1>
              {founder.role ? (
                <p className="text-lg text-foreground-muted">{founder.role}</p>
              ) : null}
              {founder.location ? (
                <p className="text-sm text-foreground-muted">{founder.location}</p>
              ) : null}
            </div>

            {links.length ? (
              <div className="flex flex-wrap justify-center gap-3 pt-2">
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

          <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="font-serif text-2xl text-foreground">About</h2>
              <p className="whitespace-pre-line text-foreground-muted">{founder.bio}</p>
            </div>

            {founder.story ? (
              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-2xl text-foreground">The story</h2>
                <p className="whitespace-pre-line text-foreground-muted">{founder.story}</p>
              </div>
            ) : null}

            {brands.length ? (
              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-2xl text-foreground">Brands</h2>
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brands/${brand.slug}`}
                      className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-muted"
                    >
                      {brand.name}
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
