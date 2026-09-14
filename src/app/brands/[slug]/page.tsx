import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Globe, ShoppingBag, MessageCircle, ExternalLink } from "lucide-react";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

interface BrandProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await brandsService.getBySlug(slug);
  if (!brand || brand.status !== "published") return {};

  return {
    title: `${brand.name} — Brandisby`,
    description: brand.tagline ?? brand.description,
  };
}

export default async function BrandProfilePage({ params }: BrandProfilePageProps) {
  const { slug } = await params;
  const brand = await brandsService.getBySlug(slug);
  if (!brand || brand.status !== "published") notFound();

  const categories = await categoriesService.list();
  const brandCategories = categories.filter((category) =>
    brand.categoryIds.includes(category.id),
  );

  const links = [
    brand.websiteUrl && { label: "Website", href: brand.websiteUrl, icon: Globe },
    brand.shopUrl && { label: "Shop", href: brand.shopUrl, icon: ShoppingBag },
    brand.instagramUrl && { label: "Instagram", href: brand.instagramUrl, icon: ExternalLink },
    brand.whatsappUrl && { label: "WhatsApp", href: brand.whatsappUrl, icon: MessageCircle },
    brand.tiktokUrl && { label: "TikTok", href: brand.tiktokUrl, icon: ExternalLink },
    brand.xUrl && { label: "X", href: brand.xUrl, icon: ExternalLink },
    brand.linkedinUrl && { label: "LinkedIn", href: brand.linkedinUrl, icon: ExternalLink },
  ].filter(Boolean) as { label: string; href: string; icon: typeof Globe }[];

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-border bg-surface-muted">
          <div className="mx-auto aspect-[21/9] w-full max-w-6xl overflow-hidden bg-surface">
            {brand.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
              <img
                src={brand.coverImageUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : null}
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-6 py-12">
          <div className="flex flex-col gap-4">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external/remote image URL, not a local asset
              <img
                src={brand.logoUrl}
                alt={`${brand.name} logo`}
                className="size-16 rounded-full border border-border object-cover"
              />
            ) : null}

            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-4xl text-foreground">{brand.name}</h1>
              {brand.tagline ? (
                <p className="text-lg text-foreground-muted">{brand.tagline}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
                {brand.location ? <span>{brand.location}</span> : null}
                {brandCategories.map((category) => (
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
                {brand.description}
              </p>
            </div>

            {brand.story ? (
              <div className="flex flex-col gap-3">
                <h2 className="font-serif text-2xl text-foreground">The story</h2>
                <p className="whitespace-pre-line text-foreground-muted">{brand.story}</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
