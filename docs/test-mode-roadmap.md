# Brandisby Test Mode — Roadmap

A smaller, validation-scoped build, requested to test whether real businesses want (1) a simple website/storefront and (2) the Smart Product Builder, with 5–20 real merchants — not the full V1 platform in `docs/roadmap.md`. That larger roadmap is paused, not abandoned: per the Test Mode brief, "if businesses use it and want to continue paying for it, then move Brandisby into the next architecture phase" (i.e., resume `docs/roadmap.md` from wherever this leaves off).

## What Phase 0 already gave this build

Everything from `docs/roadmap.md` Phase 0 (M0.1–M0.4) carries over unchanged — same app, same stack, nothing rebuilt:

- Next.js/TypeScript/Tailwind app at `apps/web`, one app, no monorepo (matches Test Mode's own "one clean application" instruction).
- Postgres (Neon, not yet provisioned) + Prisma, with `User`/`Business`/`BusinessMembership` already modeled.
- Firebase Authentication, reused from the existing `brandisby` project (decision + guardrails: `docs/decisions/002-firebase-auth-instead-of-clerk.md`) — chosen over this brief's Clerk/Supabase Auth suggestion because it was already built, tested, and reuses an account that already exists, confirmed with the user.
- Base component library (`apps/web/src/components/ui`, `shared`, `forms`).
- The "isolate each provider in a clean module, no admin swapping UI" pattern this brief asks for — already how `AuthProvider`/`FirebaseAuthProvider` is built.

## Milestones

**T1 — Merchant signup/login + business setup** ✅ done
Firebase email/password signup and login (`src/app/(auth)/signup`, `.../login`), a shared `AuthForm` client component, and server-side session handling: `AuthProvider` extended with `createSessionCookie`/`verifySessionCookie`, `getCurrentUser()` (`src/server/auth/session.ts`) reading an httpOnly cookie set by `createSessionAction`. Business setup (`src/app/onboarding/business`) collects name, brand colour, and a short description with a live-debounced handle-availability check (`checkBusinessSlugAction`) — handle normalization + a reserved-word list live in `src/server/businesses/business.schema.ts`. `createWithOwner()` creates the `Business` and its `BusinessMembership(OWNER)` in one transaction. A minimal `/dashboard` shows the business name and its `{slug}.brandisby.com` handle preview (not a working link yet — that's T2/subdomain routing).

Logo upload is intentionally **not** wired up — there's no file storage provider yet (Cloudflare R2, same "waiting on an external account" situation as Neon/Firebase credentials). The form shows a plain note instead of a non-functional control. `Business.logoUrl` exists in the schema, ready for whenever storage lands.

Verified end-to-end in a real browser (Playwright + the Firebase Auth Emulator + local Postgres, zero contact with the real Firebase project or a real database): signup → business creation (handle normalization and availability checking observed live) → dashboard → sign out → direct-visit-while-signed-out redirects to `/login` → re-login skips onboarding (business already exists) → visiting `/signup` while signed in bounces to `/dashboard`. Database rows (`User`, `Business`, `BusinessMembership`) confirmed correct via `psql`. 6 automated tests (business rules: slug normalization, reserved words, duplicate rejection, invalid input, owner membership).

One real bug found and fixed along the way: Prisma 7's `migrate dev` no longer auto-regenerates the client (must run `prisma generate` explicitly) — `db:migrate:dev` now chains it automatically so this can't be forgotten again.

**T2 — Website builder v1**
Section templates (Hero/About/Products/Testimonials/FAQ/Contact/Footer), edit text/images/colours/fonts, show/hide sections. No drag-and-drop. This is also the natural point to wire up Cloudflare R2 (`StorageProvider`), since both the website builder (section images) and the deferred logo upload need it.

**T3 — Products (simple)**
Merchant creates a plain product: name, price, images, stock.

**T4 — Smart Product Builder**
Packages, options, customer fields (text/dropdown/date/long text), file upload, add-ons, price modifiers. Tested against the brief's four example cases (personalized journal, cake, fashion item, simple retail product). No conditional logic yet (explicitly deferred by the brief).

**T5 — Storefront + cart**
Customer browses the published site, configures a Smart Product, adds to cart. This is also where tenant-aware routing (`{slug}.brandisby.com`, or `/​{slug}` if subdomains prove troublesome — brief allows either, code should not assume which) gets built.

**T6 — Paystack checkout**
Payment code isolated in its own module (no abstraction UI needed yet, per the brief). Server independently recomputes the price before accepting payment — never trusts the browser's number.

**T7 — Orders + customers**
Merchant sees the order with every selection/answer/upload attached. A `Customer` record is created automatically from the order (name, email, phone, orders — nothing more).

**T8 — Merchant dashboard**
Real metrics: total orders, revenue, customers, recent orders — replaces T1's placeholder dashboard.

**T9 — Trial + emails**
14-day trial flag (`trialStartedAt`/`trialEndsAt`/status on `Business`), blocks checkout/publishing after expiry (never deletes data). Resend wired for exactly 3 emails: welcome, order confirmation, merchant new-order alert.

**T10 — Final pass**
Walk all 10 critical flows from the brief end-to-end; fix what's broken.

## Standing rules carried over from `docs/roadmap.md`

- The two live merchant sites (root-level files, Firestore/Storage on the `brandisby` Firebase project) stay off-limits — see that doc's "Standing constraint."
- `packages/*` stays deferred (ADR 001) — everything lives in `apps/web`.
- Every schema change needs a migration; every provider (Paystack, Resend, R2) gets its own isolated module, no admin-swap UI, matching this brief's explicit instruction.
