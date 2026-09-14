import Link from "next/link";
import type { Metadata } from "next";
import { categoriesService } from "@/services/categories";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Categories — Brandisby",
  description: "Browse Brandisby's brands by category.",
};

export default async function CategoriesPage() {
  const categories = await categoriesService.list();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <PageHeader title="Categories" description="Browse brands by category." />
          <div className="mt-8">
            {categories.length ? (
              <div className="flex flex-wrap gap-3">
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
      </main>
      <SiteFooter />
    </>
  );
}
