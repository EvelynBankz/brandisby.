import Link from "next/link";

const EXPLORE_LINKS = [
  { href: "/discover", label: "Brands" },
  { href: "/categories", label: "Categories" },
  { href: "/startups", label: "Startups" },
  { href: "/founders", label: "Founders" },
  { href: "/creators", label: "Creators" },
  { href: "/journal", label: "Journal" },
];

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-serif text-2xl">Brandisby</span>
          <p className="max-w-xs text-sm text-primary-foreground/70">
            Discover the brands shaping Nigeria.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium uppercase tracking-wide text-primary-foreground/60">
            Explore
          </span>
          {EXPLORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-primary-foreground/80 hover:text-primary-foreground">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium uppercase tracking-wide text-primary-foreground/60">
            Company
          </span>
          <Link href="/about" className="text-primary-foreground/80 hover:text-primary-foreground">
            About
          </Link>
          <Link href="/get-featured" className="text-primary-foreground/80 hover:text-primary-foreground">
            Get Featured
          </Link>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-6 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Brandisby. All rights reserved.
      </div>
    </footer>
  );
}

export { SiteFooter };
