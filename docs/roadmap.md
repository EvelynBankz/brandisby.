# Brandisby V1 Implementation Roadmap

Companion to `docs/architecture-audit.md`. This roadmap sequences the rebuild described there into small milestones, per the brief's engineering rules (§38, §94-95): one milestone at a time, smallest reasonable surface, tests and docs updated alongside code, no silently-created second architecture.

Milestones are grouped into phases. Nothing here is final-priced or final-scoped — each milestone should still be expanded into the full Objective/Existing-Code-Impact/Database/Backend/Frontend/Security/Tests/Definition-of-Done format (brief §95) immediately before it's implemented, since real findings during earlier milestones may reorder later ones.

## Phase 0 — Foundation (no product features yet)

**M0.1 — Repo & tooling scaffold**
Next.js (App Router) + TypeScript (strict) + Tailwind app under `apps/web`; ESLint/Prettier; `packages/config` with a validated env module (fails fast on missing required vars); GitHub Actions workflow running typecheck/lint/build on every PR. Existing static site (`index.html`, `pages/`, `css/`, `js/`, `api/`) left untouched and still deployable during the transition.

**M0.2 — Database & Prisma**
PostgreSQL instance (Neon or Supabase), `packages/database` with Prisma schema + first migration, repository-layer convention established (UI → service → repository → Prisma). No business tables yet beyond the skeleton needed for M0.3.

**M0.3 — Internal identity & auth**
Clerk integration behind an internal `User` (`authProvider`, `authProviderUserId`) + `Business` + `BusinessMembership` model. Signup creates a `User` row keyed by Clerk's ID but referenced everywhere else by Brandisby's internal UUID (closes audit §4/§14).

**M0.4 — Design tokens & base component library**
`packages/ui` with the deep-brown/beige/off-white/taupe/accent token system (brief §98) wired through Tailwind config; shadcn/ui-style source-owned base components (Button, Input, Select, Card, Modal, Table, Badge, PageHeader, FormField, FileUpload, EmptyState).

## Phase 1 — Business, Website Builder Core, Storefront Skeleton

**M1.1 — Business creation + Brandisby handle**
Business-creation flow with real-time slug availability checking, reserved-word list, uniqueness constraint in Postgres — implements audit finding on per-merchant identity (brief §99). No custom domains yet, no `Domain` table — just `Business.slug`.

**M1.2 — Tenant-aware subdomain routing**
Next.js middleware resolving `{slug}.brandisby.com` → business, server-side, with a documented local-dev fallback (`{slug}.localhost:3000` or `/store/{slug}`). Directly replaces the client-side hostname-sniffing in the current `js/subdomain-router.js` (audit §13).

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
