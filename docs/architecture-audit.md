# Brandisby — Existing Codebase Audit

Date: 2026-09-12
Scope: audit of the repository as of commit `25a504e` (branch `main`), performed against the target architecture in the Brandisby engineering brief and product brief. This is the mandatory "audit before rebuilding" step — no large-scale implementation has started yet.

## 1. Current Tech Stack

- **No framework.** The app is plain, hand-written static HTML/CSS/vanilla JS (`index.html`, `pages/*.html`, `css/*.css`, `js/*.js`). There is no Next.js, React, or TypeScript anywhere in the repo.
- **No build system.** No bundler, no `tsconfig.json`, no linter config. `package.json` only declares two backend dependencies (`firebase-admin`, `node-fetch`) for the Vercel serverless functions in `api/`.
- **Database:** Firebase Firestore (NoSQL document store), accessed directly from the browser via the Firebase client SDK (`js/firebase-config.js`).
- **Auth:** Firebase Authentication (email/password), accessed directly from the browser (`Auth` object in `js/firebase-config.js`).
- **File storage:** Firebase Storage, accessed directly from the browser (`StorageHelper` in `js/firebase-config.js`).
- **Payments:** Two different, inconsistently wired providers:
  - Paystack Inline JS (`PaystackPop`), invoked entirely client-side in `js/checkout.js`.
  - Flutterwave, via two Vercel serverless functions (`api/verify.js`, `api/flutterwave-webhook.js`) that are hardcoded to a single brand (`serac`).
- **Email:** `api/sendTrackingEmail.js` calls an undefined `sendEmail()` function — there is no email provider SDK imported or configured anywhere. This endpoint is non-functional as written.
- **Hosting:** Vercel (`vercel.json` present, generic catch-all rewrite only — no subdomain-aware rewrite rules).
- **No monorepo, no `apps/`/`packages/` structure, no ORM, no migrations, no tests, no CI, no `/docs`, no ADRs, no environment-variable validation, no structured logging, no error monitoring, no analytics abstraction, no feature flags, no platform-admin surface.**

This is best understood as a **client-heavy static prototype**, not a foundation that the target Next.js/TypeScript/Prisma/PostgreSQL SaaS architecture can be incrementally grown from.

## 2. Current Folder Structure

```
brandisby/
├── index.html                  Public homepage
├── script.js                   (root-level, appears to duplicate/predate js/home.js)
├── css/                         global.css, home.css, brand.css, product.css, checkout.css, auth.css, dashboard.css, pages.css, store.css
├── js/                          firebase-config.js, home.js, brand.js, product.js, checkout.js, creator-signup.js, dashboard.js, subdomain-router.js
├── pages/                       brand.html, product.html, checkout.html, order-confirmation.html, creator-signup.html, login.html, dashboard.html
├── api/                         verify.js, flutterwave-webhook.js, sendTrackingEmail.js, getOrder.js, fleurdevie/getOrder.js, serac/getOrder.js
├── assets/, Brandisby_logo.png
├── vercel.json, package.json, README.md
```

Notable smell: `api/fleurdevie/getOrder.js` and `api/serac/getOrder.js` are **per-merchant, hand-duplicated copies** of `api/getOrder.js`, one folder per brand. The `package.json` name (`"serac-checkout-api"`) and the Firestore path hardcoded in `api/verify.js` / `api/flutterwave-webhook.js` (`db.collection("brands").doc("serac")...`) confirm the origin: this codebase started as a bespoke build for one or two specific clients (Sérac, Fleur de Vie) and is being stretched toward a general multi-tenant platform without being re-architected for it. Onboarding a third merchant today would require hand-writing a new `api/<brand>/getOrder.js` file — this does not scale past a handful of merchants.

## 3. Current Database Architecture

Firestore, accessed directly from client code (no service/repository layer):

- `brands/{slug}` — merchant/tenant document, keyed by the human-chosen handle itself (not an internal ID). Contains `ownerId`, `paystackKey`, `brandColor`, `productCount`, `active`.
  - `brands/{slug}/products/{id}` — subcollection, flat product with `allowCustom` + three hardcoded booleans (`customOptions.text/font/upload`). No packages, variants, personalization fields, add-ons, or pricing rules.
  - `brands/{slug}/orders/{id}` — used only by the Flutterwave path (`api/verify.js`, `api/flutterwave-webhook.js`), and only for the `serac` brand.
- `orders/{id}` (top-level collection) — used by the Paystack path (`Orders.create` in `js/firebase-config.js`, called from `js/checkout.js`), with `brandSlug` stored as a field rather than as part of the document path.
- `users/{uid}` — stores `brandSlug` (single value) linking a Firebase Auth user to one brand.

Two incompatible order-storage shapes exist for the two payment providers. There are no version-controlled Firestore security rules in the repo (`firestore.rules` / `storage.rules` are referenced by the README but do not exist in the tree) — tenant isolation cannot be audited from source, and any change to the rules happens by hand in the Firebase console with no history.

This is a proprietary NoSQL model, not PostgreSQL, and does not match brief §5/§53 ("think in terms of PostgreSQL, not a database vendor").

## 4. Current Authentication Implementation

- Firebase Auth is called directly from `js/firebase-config.js` (`Auth.signUp`, `Auth.signIn`, `onAuthChange`). The Firebase Auth UID (`uid`) is used as the primary identity everywhere — there is no internal Brandisby `User` record with `authProvider` / `authProviderUserId` (brief §12/§44).
- `1 user = 1 business` is baked into the data model (`users/{uid}.brandSlug` is a single string field) and into the creator-signup flow — there is no `BusinessMembership` join concept (brief §13/§57).
- No role system — a merchant owner, staff, and Brandisby platform staff would all be indistinguishable Firebase Auth users. No platform-admin area exists at all (brief §35/§48).

## 5. Current Website-Builder Implementation

There is no website builder. `pages/brand.html` is a single fixed storefront template with a fixed CSS theme (`css/brand.css`), parameterized only by `brand.brandColor`, brand name/logo, and a product grid. There are no editable sections, no section library (hero/testimonials/gallery/FAQ/etc.), no templates to choose from, and no publish/draft state. Every merchant gets the same page layout.

## 6. Current Product Architecture

A single flat `Product` shape per Firestore doc: name, price, images, category, stock, `allowCustom`, and up to three hardcoded customization toggles (free text, font choice, image upload — see `js/product.js:63-69,113-118`). There is no concept of:

- Packages/product types (brief §9) — the "OFF MY MIND — Basic / Made For Me" case cannot be represented.
- Variants/options (size, colour, material, etc. — brief §10).
- Personalization fields as merchant-defined, typed questions (brief §11).
- Add-ons with price modifiers (brief §13).
- Conditional logic (brief §15).
- Any pricing engine — price is just the static product price times quantity.

The Smart Product Builder — the brief's flagship differentiator — does not exist in any form yet.

## 7. Current Payment Architecture

- **Paystack path (used by the live checkout flow, `js/checkout.js:107-147`):** the Paystack Inline popup runs entirely in the browser with a client-calculated `subtotal`. On the popup's `callback`, the browser itself calls `Orders.create(...)` and writes the order straight to Firestore with `status: 'paid'` — **there is no server-side verification of the Paystack transaction anywhere in this repo.** Any client with the page open can call `Orders.create()` from the browser console with an arbitrary amount and get an order marked `paid`, bypassing payment entirely.
- **Flutterwave path (`api/verify.js`, `api/flutterwave-webhook.js`):** does correctly verify server-side against the Flutterwave API and checks amount/currency/signature — but it is hardcoded to a single brand (`serac`) and is not wired into the Paystack-based checkout UI at all. It looks like an earlier or parallel integration that was never connected to (or superseded) the current checkout page.
- There is no `PaymentProvider` interface. Paystack is invoked directly via the global `PaystackPop` in the page, and Flutterwave via direct `fetch` calls to `api.flutterwave.com` inside the serverless function. Swapping or adding a provider today means touching checkout markup, client JS, and serverless functions simultaneously.

This is the single most serious functional and security gap relative to the brief (§14, §25, §62): pricing/payment must be server-authoritative and provider-abstracted, and today it is neither.

## 8. Current Admin Architecture

`pages/dashboard.html` + `js/dashboard.js` is a **merchant** dashboard (overview stats, products CRUD, orders list/status update, brand settings) — reasonable as a UX reference for the brief's merchant-dashboard sections (§30-31), but:
- All reads/writes go directly from the browser to Firestore (no service/API layer, no server-side authorization check beyond whatever Firestore rules exist — which are not in source control).
- There is no separate **platform-admin** area (`/platform-admin` in the brief, §35-36) at all — no way for Brandisby staff to see/manage businesses, subscriptions, providers, plans, feature flags, or audit logs.

## 9. Current Technical Debt (summary)

1. Per-merchant hand-duplicated serverless routes (`api/serac/*`, `api/fleurdevie/*`) instead of a parameterized `businessId`/`slug` route.
2. Two divergent, incompatible order-storage shapes for two payment providers that were never unified.
3. Client-authoritative pricing and order creation for the live (Paystack) checkout path — no server verification.
4. `api/sendTrackingEmail.js` calls an undefined function; email sending is effectively broken.
5. No version-controlled security rules despite the README instructing manual console edits — no way to audit or reproduce tenant isolation.
6. Root-level `script.js` appears to be a leftover/duplicate of `js/home.js` (dead code to confirm and remove).
7. `package.json` name/scope (`serac-checkout-api`) reflects single-client origins, not a platform.
8. Firebase config (project keys) is hardcoded in a committed JS file — normal for Firebase's public client config, but there is no environment-variable/config module at all, for this or anything else (Paystack keys, Flutterwave keys are read via `process.env` only inside the two serverless functions that have them).
9. Zero automated tests, zero CI, zero type checking — every change today is unverified until manually clicked through.

## 10. What Can Be Retained

- **Domain vocabulary and UX flow**: brand storefront → product detail → cart → checkout (details → payment) → order confirmation is a sound, standard flow and matches brief §21/§24 — worth reusing as the information architecture for the new storefront.
- **Merchant dashboard IA**: Overview / Products / Orders / Settings maps cleanly onto brief §30.
- **Provider choices already in motion**: Vercel hosting, Paystack as primary payment rail, and a brown/beige brand palette direction (`#5a3c30`/`#1b1513` in the current CSS) are all directionally consistent with the brief (§34, §98) and can carry forward as decisions, not as code.
- **Subdomain UX concept** (`brand.brandisby.com`) is already the intended product shape (brief §99) — the current `js/subdomain-router.js` is a useful reference for desired behavior, even though its client-side-hostname-sniffing implementation cannot be reused (no SSR, no tenant-aware metadata, not usable for security-relevant routing).
- Visual reference: existing HTML/CSS pages are a legitimate design reference when building the new component library, nothing more.

Effectively nothing at the code level should be carried into the new Next.js codebase as-is; it should all be treated as a wireframe/spec, not a migration source.

## 11. What Should Be Refactored / Rebuilt

Given the brief mandates Next.js + TypeScript + Tailwind + Prisma + PostgreSQL, and the current app is static HTML/JS + Firestore, this is not an incremental refactor — it is a **ground-up rebuild** on the new stack, using the current app only as a product/UX reference. Recommend explicitly retiring (not deleting — keep in git history) the current static site once the new app reaches parity for launch-blocking flows (brief §87 success criteria), rather than attempting to evolve the Firestore data model into Postgres in place.

## 12. What Is Missing for V1 (relative to the brief)

Essentially the full list in brief §2-§97, most importantly:
- Next.js/TS monorepo scaffold with domain-based `packages/` boundaries.
- Internal `User` + `BusinessMembership` + `Business` model, decoupled from the auth provider.
- PostgreSQL + Prisma schema with version-controlled migrations, tenant-scoped (`businessId`) on every owned table.
- `PaymentProvider`, `EmailProvider`, `StorageProvider`, `AnalyticsService` interfaces with a single initial adapter each (Paystack, Resend, Cloudflare R2, PostHog).
- Server-side authoritative pricing engine; order snapshotting.
- Smart Product Builder domain model (Product/Package/Option/Variant/Field/Addon/Rule) and its Configuration → Rules → Pricing → Rendering → Snapshot pipeline.
- Section-based website builder with a small template set.
- Tenant-aware subdomain routing at the framework/middleware level (not client-side hostname sniffing).
- Platform-admin app, feature flags, audit logs, validated env-config module, structured logging, Sentry, Zod validation at every server boundary.
- Tests (Vitest + Playwright), CI (GitHub Actions), `/docs`, ADRs.

## 13. Main Scalability Risks

1. **Per-merchant code duplication** (`api/<brand>/getOrder.js`) is a hard ceiling — it does not scale past a handful of hand-onboarded merchants and must not be repeated in the new architecture.
2. **No tenant-aware server-side routing** — subdomain resolution happens by reading `window.location.hostname` in the browser after page load, which cannot support SSR, per-tenant SEO metadata, or secure tenant-scoped authorization.
3. **No background-job story** — email/notifications are synchronous, best-effort, and (currently) broken; nothing here anticipates a future queue (brief §25/§82).
4. **Firestore's document/subcollection shape was already outgrown** once two payment providers needed two different order shapes — a sign the data model needs a real relational schema with a single `Order` table and `businessId` foreign key, not per-brand collection nesting.

## 14. Main Security Risks

1. **Critical — client-authoritative payments**: the live Paystack checkout path creates `status: 'paid'` orders directly from browser JS with no server-side transaction verification (§7 above). This must be fixed before any real payment volume goes through the current app, and must not be repeated in the rebuild — brief §14/§25/§62 exist specifically to prevent this class of bug.
2. **Unaudited tenant isolation**: Firestore security rules are not in source control, so there is no way to confirm from the repo that one merchant cannot read/write another merchant's `products`/`orders`/`brand` document. The new architecture must enforce tenant scoping server-side, in code, not only in database rules (brief §14).
3. **No internal auth abstraction / no role separation**: any authenticated Firebase user could, depending on undocumented Firestore rules, potentially reach data or actions not scoped to them. No platform-admin vs. merchant-user role boundary exists.
4. **File uploads unvalidated**: `StorageHelper.uploadImage` (`js/firebase-config.js:172-178`) uploads whatever `File` object it's given with no MIME-type, size, or ownership checks (brief §65).
5. **Broken email endpoint** (`api/sendTrackingEmail.js`) calls an undefined function — not itself a security hole, but indicates untested server code shipped to `api/`.
6. **Firebase client config and Paystack public key are client-visible** — this is expected/normal for these specific values (they are public-by-design keys), but there is no config module distinguishing "safe to expose" from "must stay server-only," so the pattern isn't guaranteed to generalize safely to future secrets.

## 15. Recommended Final V1 Architecture

Adopt the brief's stack and structure directly, with the audit above used to sequence the rebuild:

- **App shape**: start as a single Next.js (App Router) + TypeScript application inside a light monorepo shell (`apps/web`, `packages/{ui,database,auth,payments,storage,email,analytics,validation,config,types}`), per brief §3/§58 — "do not introduce monorepo complexity if too early," but *do* keep the package boundaries even if `apps/platform-admin` doesn't get its own deployable app until later. Turborepo only if/when build times justify it.
- **Database**: PostgreSQL (Neon or Supabase-hosted to start), Prisma ORM, migrations committed to git from day one. Core tables: `User`, `BusinessMembership`, `Business`, `Product`, `ProductPackage`, `ProductOption(Value)`, `ProductVariant`, `ProductField`, `ProductAddon`, `ProductRule`, `Order`, `OrderConfigurationSnapshot`, `Customer`, `Domain`(subdomain/custom-domain), every tenant-owned table carrying `businessId`.
- **Auth**: Clerk as the initial provider behind an internal `User` model keyed by Brandisby's own UUID; all foreign keys reference the internal `User.id`, never the Clerk ID directly.
- **Payments**: `PaymentProvider` interface with a `PaystackPaymentProvider` implementation; checkout always ends in a server action that re-derives the price from the Smart Product Builder pricing engine and verifies the transaction server-side before creating an order — the exact gap identified in §7/§14 above.
- **Storage/Email/Analytics**: `StorageProvider` (Cloudflare R2), `EmailProvider` (Resend), `AnalyticsService` (PostHog) interfaces, each with one adapter, matching brief §8, §40, §41, §43.
- **Multi-tenancy & routing**: `businessId` on every owned row, tenant resolved server-side in middleware from the subdomain (with a documented `*.localhost:3000` or `/store/:slug` fallback for local dev), never trusted from client state alone.
- **Smart Product Builder**: modeled as its own domain package from the start (`smart-product-builder`), with the Configuration → RulesEngine → PricingEngine → StorefrontRenderer → OrderConfigurationSnapshot pipeline as separate modules, not one component.
- **Everything else** (website builder sections/templates, digital delivery, platform-admin, feature flags, audit logs, Sentry + structured logging, Zod validation at every server boundary, Vitest/Playwright, GitHub Actions CI) follows the brief directly; see `docs/roadmap.md` for sequencing.

The existing static site can stay live/deployed as-is while the new app is built in parallel on this branch/monorepo, and should only be retired once the new app reaches the brief's §87 launch checklist.
