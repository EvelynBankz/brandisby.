import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/categories", label: "Categories" },
  { href: "/startups", label: "Startups" },
  { href: "/founders", label: "Founders" },
  { href: "/creators", label: "Creators" },
  { href: "/journal", label: "Journal" },
];

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="font-serif text-2xl text-foreground">
          Brandisby
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-foreground-muted lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link href="/get-featured">Get Featured</Link>
        </Button>
      </div>
    </header>
  );
}

export { SiteHeader };
