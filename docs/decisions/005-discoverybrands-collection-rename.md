# 005 — Rename this app's `brands` collection to `discoveryBrands`

## Decision

This platform's Firestore collection for brand profiles is now
`discoveryBrands`, not `brands`. `src/services/brands.ts`, `firestore.rules`,
`firestore.indexes.json`, `scripts/seed-emulator.mjs`, and the tests were all
updated. The `Brand` TypeScript interface, the `/brands/[slug]` route, the
`brandsService` name, and the `BrandCard` component are all unchanged — this
is purely a Firestore collection rename, not a rebrand of this app's own
information architecture.

## Reason

ADR 003 flagged, but deliberately did not resolve, a risk: this app's
`brands` collection might collide with something else on the real
`brandisby` Firebase project. ADR 004 (the repo restructure) surfaced new
information — Sérac and Fleur De Vie's live sites are hosted in separate
repositories (`EvelynBankz/serac`, `EvelynBankz/fleurdevie`) — which raised
the question of whether they even use the same Firebase project at all.

Both repositories were cloned and checked directly. Both hard-code
`projectId: "brandisby"` — the same real project this app would eventually
connect to. Both write live order/quote data via their Paystack/Flutterwave
webhook handlers into:

- `brands/{brandId}/orders/{orderId}`
- `brands/{brandId}/quotes/{quoteId}`

(e.g. `brands/serac/orders/...`, confirmed in `serac/api/verify.js`,
`serac/api/flutterwave-webhook.js`, `serac/api/paystack-webhook.js`, and the
equivalent files in `fleurdevie`). This is real, currently-live commerce
data, not a stale or hypothetical concern.

If this app had kept using `brands` as its collection name, seeding or
later admin-panel-writing a document at `brands/serac` (the natural document
ID for a "Sérac" editorial profile) would overwrite that document's
top-level fields with this app's unrelated schema, sitting directly beside
the real `orders`/`quotes` subcollections underneath it. Firestore
subcollections aren't deleted by a parent `.set()`, so this wouldn't destroy
the orders/quotes themselves, but it's still writing platform content
directly on top of live commerce infrastructure on the same project — not
something to leave to chance.

Given the confirmed collision, and asked directly, the user chose to rename
this app's own collection rather than rely on operational discipline (e.g.
"never seed a doc ID that matches a live brand's slug") to avoid the clash.

## Consequences

- This app can safely share the real `brandisby` Firebase project with
  Sérac and Fleur De Vie's live sites without any risk of touching their
  `brands/{slug}/{orders,quotes}` data, now or from a future admin panel.
- `categories`, `startups`, `founders`, `creators`, `articles`,
  `applications`, `newsletterSubscribers`, `ads`, `pageViews`,
  `linkClicks`, and `adminUsers` were all checked against both live repos'
  `collection(...)` calls — none collide (the live sites only ever use
  `brands`, `orders`, `quotes`, and `webhook_unrouted`) — so none of those
  needed renaming.
- This closes the open question ADR 003 and ADR 004's README section left
  unresolved. A real Firebase service account for the `brandisby` project
  is still needed before this app can run against it (see README) — that
  part is unchanged.
