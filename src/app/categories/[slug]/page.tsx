import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brandsService } from "@/services/brands";
import { categoriesService } from "@/services/categories";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { BrandCard } from "@/components/marketing/brand-card";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await categoriesService.getBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} — Brandisby`,
    description: `Brands in ${category.name} on Brandisby.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await categoriesService.getBySlug(slug);
  if (!category) notFound();

  const brands = await brandsService.search({ categoryId: category.id, max: 60 });

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <PageHeader title={category.name} description={`Brands in ${category.name}.`} />
          <div className="mt-8">
            {brands.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {brands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            ) : (
              <EmptyState title="No brands in this category yet" />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
