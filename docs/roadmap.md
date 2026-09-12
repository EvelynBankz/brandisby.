# Brandisby V1 Implementation Roadmap

Companion to `docs/architecture-audit.md`. This roadmap sequences the rebuild described there into small milestones, per the brief's engineering rules (§38, §94-95): one milestone at a time, smallest reasonable surface, tests and docs updated alongside code, no silently-created second architecture.

Milestones are grouped into phases. Nothing here is final-priced or final-scoped — each milestone should still be expanded into the full Objective/Existing-Code-Impact/Database/Backend/Frontend/Security/Tests/Definition-of-Done format (brief §95) immediately before it's implemented, since real findings during earlier milestones may reorder later ones.

## Standing constraint: the two live merchant sites are off-limits

The repository root (`index.html`, `pages/`, `css/`, `js/`, `api/`, root `package.json`, `vercel.json`) currently serves two live merchant websites (Sérac and Fleur de Vie), both connected to the existing Firebase project `brandisby` in Firestore. **No milestone in this roadmap may modify, delete, or redeploy those files, or read/write that Firestore project**, until a deliberate, explicitly-approved migration/cutover decision is made — separate from and after this roadmap's launch checklist (M6.3). The new app is built entirely under `apps/web` with its own database (Postgres, from M0.2) and its own provider credentials, so this should never require touching the legacy paths; if any future milestone appears to need to, stop and flag it rather than proceeding.

## Phase 0 — Foundation (no product features yet)

**M0.1 — Repo & tooling scaffold** ✅ scaffolded
Next.js 16 (App Router) + TypeScript (strict) + Tailwind v4 app under `apps/web`, fully self-contained (own `package.json`/lockfile, no root workspace changes — see `docs/decisions/001-single-app-before-packages.md`). ESLint (flat config) + `typecheck`/`lint`/`build` scripts; a validated env module at `apps/web/src/config/env.ts` (Zod, fails fast, imported from the root layout so it runs on boot); semantic design tokens in `globals.css` (background/surface/foreground/primary/accent/border/status colours) using the brand palette, accent flagged as a placeholder pending approval; `.github/workflows/web-ci.yml` running typecheck/lint/build on PRs touching `apps/web/**`. `packages/*` workspaces deferred until a second app or real sharing need exists (see the ADR). Existing static site left completely untouched per the standing constraint above.

**M0.2 — Database & Prisma** ✅ scaffolded (provider not yet provisioned)
Prisma 7 (`apps/web/prisma/schema.prisma`, `prisma7.config.ts`) with the `User` / `Business` / `BusinessMembership` skeleton (internal UUIDs, `authProvider`/`authProviderUserId`, membership as a join table — never a 1-user-1-business assumption) and a first migration (`prisma/migrations/20260912163806_init`), generated and applied against a local throwaway Postgres and committed as portable SQL. Prisma 7 requires an explicit driver adapter for SQL connections — using `@prisma/adapter-pg` (the standard `pg` driver) rather than a Neon-specific adapter, since it works identically against local Postgres, Neon, or Supabase without code changes (the Neon-specific adapter speaks Neon's proprietary WebSocket protocol and won't run against a plain local Postgres). Repository-layer convention established with `businessRepository`/`businessService` (UI → service → repository → Prisma) and proven end-to-end by a Vitest integration test that runs against a real Postgres; CI now runs a `postgres:16` service container, `prisma migrate deploy`, and the test suite before build. **Still needed:** an actual Neon project — nobody has provisioned one yet, so there is no real `DATABASE_URL` outside of local dev and CI's throwaway container. `packages/database` deferred along with the rest of `packages/*` per ADR 001; the schema/client live under `apps/web` for now.

**M0.3 — Internal identity & auth**
Clerk integration behind an internal `User` (`authProvider`, `authProviderUserId`) + `Business` + `BusinessMembership` model. Signup creates a `User` row keyed by Clerk's ID but referenced everywhere else by Brandisby's internal UUID (closes audit §4/§14).

**M0.4 — Design tokens & base component library**
`packages/ui` with the deep-brown/beige/off-white/taupe/accent token system (brief §98) wired through Tailwind config; shadcn/ui-style source-owned base components (Button, Input, Select, Card, Modal, Table, Badge, PageHeader, FormField, FileUpload, EmptyState).

## Phase 1 — Business, Website Builder Core, Storefront Skeleton

**M1.1 — Business creation + Brandisby handle**
Business-creation flow with real-time slug availability checking, reserved-word list, uniqueness constraint in Postgres — implements audit finding on per-merchant identity (brief §99). No custom domains yet, no `Domain` table — just `Business.slug`.

**M1.2 — Tenant-aware subdomain routing**
Tenant resolution for `{slug}.brandisby.com` → business, server-side, with a documented local-dev fallback (`{slug}.localhost:3000` or `/store/{slug}`). Directly replaces the client-side hostname-sniffing in the current `js/subdomain-router.js` (audit §13). Note: this Next.js version renamed `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()` (edge runtime not supported under the new name) — implement as `apps/web/src/proxy.ts`, not `middleware.ts`.

**M1.3 — Website builder: sections v1**
Section-based editor (Header, Hero, Featured Products, About, Footer to start) with content/image/color editing and show/hide/reorder — not freeform drag-and-drop. One starter template.

**M1.4 — Public storefront shell**
Home/About/Contact pages rendering the business's sections; no products yet.

## Phase 2 — Smart Product Builder (the differentiator)

**M2.1 — Product domain model**
`Product`, `ProductPackage`, `ProductOption`, `ProductOptionValue`, `ProductVariant`, `ProductAsset` tables + migrations, each tenant-scoped via `businessId`. Simple-product path only (name/price/images/stock — the "Handbag" case).

**M2.2 — Merchant product builder UI (simple path)**
Create/edit/list/delete for simple products, matching the "simple when simple" principle (brief §16).

**M2.3 — Packages**
Merchant-defined packages within a product (arbitrary names, own price/images/stock — the "Off My Mind — Basic / Made For Me" case).

**M2.4 — Personalization & Customization fields**
`ProductField` model (text/long text/dropdown/radio/checkbox/date + upload for customization), package-scoped applicability.

**M2.5 — Add-ons & price modifiers**
`ProductAddon`, `ProductRule` (simple "show when / add price when" conditions, no general automation engine), merchant-friendly condition UI (no exposed technical syntax).

**M2.6 — Server-side pricing engine**
`calculateProductPrice(product, configuration)` as its own service; storefront gets an estimated live price, server recomputes authoritatively at checkout — directly fixes audit §7/§14 critical finding.

**M2.7 — Storefront renderer**
Product page dynamically renders whatever the merchant configured (fields/options/add-ons) from the same underlying model used by the builder — no separate storefront product model (brief §19).

## Phase 3 — Commerce: Cart, Checkout, Orders, Customers

**M3.1 — Cart**
Client-side cart (can start as local/session state), adapted per product type (no shipping fields for digital).

**M3.2 — `PaymentProvider` abstraction + Paystack**
Interface (`initializePayment/verifyPayment/refundPayment/handleWebhook/getTransaction`) with a `PaystackPaymentProvider`. Directly replaces the unabstracted, unverified client-only flow in the current `js/checkout.js` (audit §7/§14, the most serious open item from the audit).

**M3.3 — Checkout + order creation**
`createCheckout()`/`completeOrder()` server actions; order snapshot (product/package/options/fields/add-ons/final total) recorded at purchase time so later product edits never rewrite history (brief §22/§27).

**M3.4 — Customers**
Auto-created/updated `Customer` records from orders; order history, totals, last order.

**M3.5 — Inventory**
Stock at product/package/variant level; in-stock/out-of-stock/low-stock states.

**M3.6 — Webhook handler**
`/api/webhooks/paystack` verifying signature, normalizing the event, handing off to an internal order/payment service — isolates provider-specific payloads from the rest of the app (brief §26).

## Phase 4 — Digital Products, Dashboard, Trials

**M4.1 — Digital products & secure delivery**
`StorageProvider` abstraction (Cloudflare R2 adapter) + signed-URL delivery after verified payment; no permanent public file URLs (audit §14 file-upload gap, brief §23).

**M4.2 — `EmailProvider` abstraction + transactional email**
Interface + Resend adapter; order confirmation, digital delivery, trial reminder templates stored independently of the provider — replaces the currently broken `api/sendTrackingEmail.js`.

**M4.3 — Merchant dashboard v1**
Home (revenue/orders/customers/recent orders/low stock), Website, Products, Orders, Customers, Settings — server-authorized, no direct client DB access (closes audit §8 gap).

**M4.4 — Trials & subscriptions**
14-day trial tracking, plan config (not hardcoded pricing), monthly/annual billing shape, trial-expiration policy (soft lock, not deletion).

## Phase 5 — Platform Operations

**M5.1 — Platform admin shell**
Separate `/platform-admin` surface, staff-only roles (`SUPER_ADMIN/ADMIN/SUPPORT/ENGINEER/FINANCE`), Businesses/Users/Subscriptions overview.

**M5.2 — Provider registry + feature flags**
Read-only provider status view (category/adapter/enabled/default, no secrets rendered); basic feature-flag table (`smartProductConditionalLogic`, `digitalProducts`, `customDomains`, etc.).

**M5.3 — Analytics & monitoring**
`AnalyticsService` (PostHog adapter) wired to the event list in brief §76; Sentry + structured internal logger (request/business/user/operation context, never secrets).

**M5.4 — Audit logs**
Sensitive platform-admin actions (provider changes, business suspension, flag changes) logged with before/after where practical.

## Phase 6 — Hardening & Launch Readiness

**M6.1 — Test coverage for critical flows**
Vitest for pricing/rules/trial calculations; integration tests for order creation, payment webhook handling, inventory updates; Playwright for the brief §75 critical-flow list.

**M6.2 — `/docs` completion + ADRs**
architecture.md, database.md, smart-product-builder.md, payments.md, authentication.md, providers.md, deployment.md, local-development.md, environment-variables.md; ADRs for the load-bearing decisions already made along the way (Postgres, multi-tenancy shape, payment abstraction, smart-product model).

**M6.3 — Launch checklist**
Verify against brief §87 end-to-end: create account → business → template → customize → simple/Smart Product → publish → receive order → accept payment → view configuration accurately → manage order.

## Sequencing Notes

- Phase boundaries are logical, not strict — e.g. M3.2 (payment abstraction) should land before any real checkout testing, even though it's listed after the product-builder phase.
- Custom domains (brief §99, "Domain" entity, `Domain.type`/verification/primary) are intentionally deferred past M1.1 — the brief explicitly allows the Brandisby subdomain to ship first and custom domains to follow without blocking launch.
- The old static site (`index.html`, `pages/`, `js/`, `css/`, `api/`) should stay deployed and untouched through Phase 0-4, and only be retired after M6.3 passes, per the audit's recommendation to treat it as a reference rather than a migration source.
- Do not start Phase 1 implementation without confirming M0 scope first — this roadmap is the "roadmap complete" checkpoint called for by brief §96; the next step is to turn M0.1 into a full milestone spec (brief §95) and begin implementation.

## Status

- M0.1: done (`apps/web` scaffold, env module, design tokens, CI).
- M0.2: schema/migration/repository-layer/tests done; a real Neon project still needs to be provisioned (nobody has an account/connection string yet — see "Next step" in the root README).
- M0.3 (internal identity & Clerk auth) is next once a live database exists.
