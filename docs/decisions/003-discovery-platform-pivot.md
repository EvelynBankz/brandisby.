# 003 — Pivot from commerce SaaS to a Firestore-backed discovery/editorial platform

## Decision

`apps/web` is no longer a multi-tenant ecommerce platform (merchant signup, Smart Product Builder, Paystack checkout). It is now **Brandisby**, a curated discovery and editorial platform for Nigerian brands, startups, founders, and creators — no merchant accounts, no checkout, no commerce. The database moved from PostgreSQL/Prisma to **Firestore**; file storage (Cloudflare R2) was removed and deferred (image URLs only for now). Firebase Authentication is now for internal/admin login only, not public merchant accounts.

This supersedes ADR 002 in spirit (Firebase Auth's role changes from "merchant identity provider" to "admin login only") and makes the Postgres-related decisions in `docs/roadmap.md`/`docs/test-mode-roadmap.md` obsolete for this app. Those docs are left in place, marked superseded, as a historical record — the audit of the legacy static site they contain is still accurate and relevant regardless of this pivot.

## What was removed

- `prisma/` (schema, migrations), `@prisma/client`, `@prisma/adapter-pg`, `pg` — no Postgres database anymore.
- `src/server/businesses/`, `src/server/websites/`, `src/server/users/` — the merchant business/website-builder domain.
- `src/server/storage/`, `@aws-sdk/client-s3`, `s3rver` — the Cloudflare R2 storage abstraction (per this brief: "Do not use Firebase Storage yet... use image URLs... structure the code so image storage can be added later").
- `src/app/(auth)/`, `src/app/onboarding/`, `src/app/dashboard/` — public merchant signup/login/business-setup/dashboard pages.
- `src/server/auth/` (the swappable `AuthProvider` interface) — no longer needed; this app is Firebase-first by the brief's own mandate, not provider-swappable, so a direct `lib/firebase/admin.ts` replaces it.

## What's new

- `src/lib/firebase/client.ts` + `admin.ts` — Firebase client/admin SDK setup (Auth + Firestore), per the brief's suggested structure.
- `src/services/` — Firestore service layer (`brands.ts`, `categories.ts` so far; `startups`/`founders`/`creators`/`articles`/`applications`/`ads`/`newsletter` follow in later milestones), each function going through the Admin SDK server-side.
- `firestore.rules` + `firestore.indexes.json` — version-controlled security rules: public read only for `status: "published"` content, admin-only writes (gated on membership in an `adminUsers` collection), public `create`-only on `applications`/`newsletterSubscribers` (never publicly readable), analytics collections writable only server-side.
- `scripts/seed-emulator.mjs` — seeds sample data into the local Firestore emulator for development; refuses to run unless `FIRESTORE_EMULATOR_HOST` is set, so it can never touch the real project.
- An editorial serif headline font (Playfair Display) alongside the existing Geist Sans, per the brief's typography direction — the brand color tokens (deep brown/beige/off-white/taupe/accent) from the original design system are unchanged and reused as-is.

## Reason

The user provided a complete, detailed new product brief ("BRANDISBY — FIREBASE TEST-MODE BUILD BRIEF") redefining what Brandisby is, with explicit instruction to use it as the source of truth and start coding. Given the scale of the contradiction with the in-progress commerce build (different product, different database technology), this was confirmed explicitly with the user as a full replacement before any code was removed, rather than assumed.

## Consequences

- Local development and tests now require the Firebase **Auth and Firestore** emulators (`npm run test` wraps both via `firebase emulators:exec`); CI's build step also runs inside the emulator wrapper since the homepage statically generates at build time and reads Firestore.
- A real Firebase service account (scoped to Firestore + Firebase Authentication Admin, not a broad Owner/Editor role) is still needed before this can run against the real `brandisby` Firebase project — same "waiting on external credentials" situation as before, just narrower in scope now that there's no separate Neon/R2 dependency.
- **Collection-name collision, unresolved:** the legacy static site's Firestore usage (`js/firebase-config.js`) stores merchant data in a top-level `brands` collection (`brands/{slug}`, ecommerce-shaped: `paystackKey`, `productCount`, a `products` subcollection). This discovery platform also uses a top-level `brands` collection, with an unrelated editorial schema (`tagline`, `story`, `founderIds`, etc.). Everything so far has only run against the local Firestore emulator specifically to avoid this collision — **do not point `apps/web` at the real `brandisby` project's Firestore until this is deliberately resolved** (e.g. a distinct collection name, or an intentional data-model merge given Sérac/Fleur de Vie/Evelyn Bankz are apparently meant to appear as Brandisby's own featured brands per the brief's screenshots). Flagged in the README; not decided here.
- Any future return to a commerce/merchant-platform direction should be treated as a fresh decision, not a revival of the removed code — Firestore's data model and this brief's product shape are different enough that the old Postgres schema wouldn't map cleanly onto it anyway.
