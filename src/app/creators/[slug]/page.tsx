import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, ExternalLink } from "lucide-react";
import { creatorsService } from "@/services/creators";
import { categoriesService } from "@/services/categories";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

interface CreatorProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CreatorProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const creator = await creatorsService.getBySlug(slug);
  if (!creator || creator.status !== "published") return {};

  return {
    title: `${creator.name} — Brandisby`,
    description: creator.tagline ?? creator.bio,
  };
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { slug } = await params;
  const creator = await creatorsService.getBySlug(slug);
  if (!creator || creator.status !== "published") notFound();

  const categories = await categoriesService.list();
  const creatorCategories = categories.filter((category) =>
    (creator.categoryIds ?? []).includes(category.id),
  );

  const links = [
    creator.websiteUrl && { label: "Website", href: creator.websiteUrl, icon: Globe },
    creator.instagramUrl && { label: "Instagram", href: creator.instagramUrl, icon: ExternalLink },
    creator.tiktokUrl && { label: "TikTok", href: creator.tiktokUrl, icon: ExternalLink },
    creator.youtubeUrl && { label: "YouTube", href: creator.youtubeUrl, icon: ExternalLink },
    creator.xUrl && { label: "X", href: creator.xUrl, icon: ExternalLink },
  ].filter(Boolean) as { label: string; href: string; icon: typeof Globe }[];

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="mx-auto w-full max-w-4xl px-6 py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="size-28 overflow-hidden rounded-full border border-border bg-surface-muted">
              {creator.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
                <img
                  src={creator.photoUrl}
                  alt={creator.name}
                  className="size-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-4xl text-foreground">{creator.name}</h1>
              {creator.tagline ? (
                <p className="text-lg text-foreground-muted">{creator.tagline}</p>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-foreground-muted">
                {creator.location ? <span>{creator.location}</span> : null}
                {creatorCategories.map((category) => (
                  <Link key={category.id} href={`/categories/${category.slug}`}>
                    <Badge variant="outline">{category.name}</Badge>
                  </Link>
                ))}
              </div>
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
              <p className="whitespace-pre-line text-foreground-muted">{creator.bio}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
