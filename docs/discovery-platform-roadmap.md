# Brandisby Discovery Platform — Roadmap

Current plan, per the "BRANDISBY — FIREBASE TEST-MODE BUILD BRIEF." Brandisby is a curated discovery and editorial platform for Nigerian brands, startups, founders, and creators — not ecommerce, no merchant dashboards, no checkout. See `docs/decisions/003-discovery-platform-pivot.md` for why this replaces the earlier commerce-platform direction.

## Milestones (per the brief's own breakdown)

**M1 — Project setup + Firebase + design system** ✅ done
`src/lib/firebase/client.ts` (Auth + Firestore, client SDK) and `admin.ts` (Admin SDK, server-only). `src/config/env.ts` rewritten for Firebase-only config (no Postgres/R2). Reused the existing brand design tokens (deep brown/beige/off-white/taupe/accent) from the earlier build as-is; added an editorial serif headline font (Playfair Display) alongside Geist Sans, per the brief's typography direction. `firestore.rules` + `firestore.indexes.json` committed from day one (public read only for published content, admin-only writes, public create-only on applications/newsletter signups, analytics server-write-only). Local dev/tests run against the Firebase **Auth + Firestore emulators** (`npm run test` wraps both; `scripts/seed-emulator.mjs` seeds sample data and refuses to run without `FIRESTORE_EMULATOR_HOST` set, so it can never touch the real project).

**M2 — Homepage + shared layout** ✅ mostly done
`SiteHeader`/`SiteFooter` (nav per the brief's V1 site structure) and the full homepage section list: Hero, Featured Brands, New & Noteworthy, Startup Spotlight, Founder Stories, Trending Brands, Browse by Category, What People Are Saying, Latest from the Journal, Creator Spotlight, Get Featured CTA. Featured/New/Trending Brands and Categories read real data through `src/services/brands.ts` and `categories.ts` (Firestore, via the Admin SDK, in a Server Component with `revalidate = 300`). Sections without a modeled collection yet (Startups, Founders, Journal, Creators, Testimonials) show an honest "coming soon" empty state — brief explicitly says never fabricate quotes/content, so no placeholder brand names or invented testimonials were hardcoded. Verified in a real browser against the seeded Firestore emulator (screenshot taken, not just typechecked) — brand cards, category chips, and empty states all render correctly with the brand palette and serif/sans typography applied.
**Still open**: nav links to `/discover`, `/categories`, `/startups`, `/founders`, `/creators`, `/journal`, `/about`, `/get-featured` 404 until M3-M6 build those routes — expected at this stage, not a bug.

**M3 — Brands + categories + profile pages** ✅ done
`/brands/[slug]` profile pages (logo, cover image, name, tagline, location, category badges linking to `/categories/[slug]`, about, story, website/shop/social links) — 404s via `notFound()` for a missing or non-published slug. Founder and related-article sections are intentionally omitted rather than faked, since `founders`/`articles` services don't exist yet (M4/M5). `/discover` browse page (search, category, location, featured — deliberately not overbuilt: a plain GET `<form>` so filtering works without client JS, sorted newest-first by default instead of a separate sort control) backed by a new `brandsService.search()`. `/categories` index and `/categories/[slug]` pages, backed by a new `categoriesService.getBySlug()`. `firestore.indexes.json` updated with the composite indexes these queries need.

One real bug found and fixed: the in-memory search/location filter in `brandsService.search()` was case-insensitive but not diacritic-insensitive, so searching "serac" didn't match "Sérac" — fixed by normalizing both sides through Unicode NFD decomposition + stripping combining marks before comparing (covered by a new test).

**M4 — Founders + startups + creators**
`src/services/founders.ts`, `startups.ts`, `creators.ts` + their profile pages (`/founders/[slug]`, `/startups/[slug]`, `/creators/[slug]`). Wires the homepage's Founder Stories / Startup Spotlight / Creator Spotlight sections to real data, replacing the M2 empty states.

**M5 — Journal/blog**
`src/services/articles.ts`, `/journal` index + `/journal/[slug]` article pages, rich-text article body, SEO fields (title/description/OG image), related brand/founder/creator links. Wires the homepage's Journal section to real data.

**M6 — Get Featured applications**
`/get-featured` public application form (brand/startup/founder/creator/story-pitch), `src/services/applications.ts` (public `create`, never publicly readable — enforced by `firestore.rules`), status workflow (`submitted` → `under_review` → `approved`/`rejected`/`needs_more_info`).

**M7 — Internal admin**
Admin-only login (Firebase Auth, gated on `adminUsers` collection membership per `firestore.rules`) and a lightweight `/admin` panel: Dashboard, Brands, Startups, Founders, Creators, Articles, Categories, Applications (convert approved → profile), Featured Content, Ads, Newsletter, Settings.

**M8 — Ads + newsletter + analytics**
Banner ads / sponsored brand / sponsored article / featured placement (manual campaign management, no ad-tech platform), clearly labeled "Sponsored." Newsletter signup (Resend + Firestore subscribers, or MailerLite/Brevo free tier — whichever is simplest when this milestone starts). Simple Firestore-counter analytics (page views, profile views, link clicks) written server-side only, per `firestore.rules`.

**M9 — SEO + testing + launch readiness**
Sitemap, robots.txt, per-page metadata/OG/structured data, social share buttons. Critical-flow tests. Final pass against the brief's §37 success criteria.

## Standing rules

- No merchant accounts, no checkout, no payments, no inventory — see the brief's §36 "what not to build yet" list.
- Never fabricate testimonials/quotes; always retain attribution once real ones exist.
- No Firebase Storage yet — image URLs only, but every service/schema is written so a `logoUrl`/`coverImageUrl`-style field can later point at real uploaded assets without a rework.
- Public Firestore reads only ever see `status: "published"` content; admin mutations go through the (not-yet-built) admin panel's Server Actions, never a direct client write outside what `firestore.rules` explicitly allows (applications, newsletter signups).
- The two live legacy merchant sites (Sérac, Fleur de Vie static pages) and their Firestore data in the *existing* `brandisby` Firebase project remain completely separate from this app's own `brands`/`startups`/etc. collections — this app reads/writes its own collections only, never touches that legacy data.
