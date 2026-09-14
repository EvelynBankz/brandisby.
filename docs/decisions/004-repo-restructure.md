# 004 — Promote `apps/web` to the repository root; remove the legacy static site

## Decision

`apps/web` (the Firestore-backed discovery platform from ADR 003) is now the
entire contents of this repository — its `src/`, `package.json`,
`next.config.ts`, `firestore.rules`, etc. moved up to the repo root. The
previous root-level legacy static site (`index.html`, `pages/`, `css/`,
`js/`, `api/`, the old `package.json`, `vercel.json`) was deleted. Brand
image assets (`assets/logo-*.png`, `Brandisby_logo.png`) were kept and moved
into a new `public/` directory rather than deleted.

## Reason

The repository's connected Vercel project ("brandisby.") has its Root
Directory set to the repo root (confirmed via the project's PR-comment
metadata: `"rootDirectory": null`), not `apps/web`, and there is no
dashboard/API access available from this environment to change that
setting. Every PR preview and every production deploy from this repo was
therefore building the legacy static site regardless of what changed under
`apps/web` — the new platform had never actually been reachable at a live
URL, which is why its landing-page work wasn't visible when checked live.

Earlier documentation in this repo (README, prior ADRs) stated the root
files were "live production code for two real merchant sites (Sérac and
Fleur de Vie)" and must never be touched. That was based on the original
project brief and was not re-verified against current reality. The user
clarified during this restructure that Sérac and Fleur De Vie's actual live
sites are hosted in a **separate repository** and connect straight to their
domain via Vercel — this repo's root files were not what served their live
traffic. Given that, and given the user's explicit instruction to replace
the root entirely with the new platform, moving `apps/web` up and deleting
the legacy files was safe to do on this branch (nothing takes effect until
merged to `main`, the same review checkpoint every other change in this
repo has gone through).

## What changed

- Every file under `apps/web/` moved to the repository root (git mv, history
  preserved).
- Deleted: `index.html`, `pages/`, `css/`, `js/`, `api/` (Flutterwave
  webhook, order-verification, and order-lookup serverless functions — see
  "Reason" above for why this was confirmed not to affect Sérac/Fleur De
  Vie's actual live checkout), the old root `package.json`
  ("serac-checkout-api"), `vercel.json`, `script.js`.
- Kept and moved: `assets/logo-light.png`, `assets/logo-transparent.png`,
  `Brandisby_logo.png` → `public/` (real brand assets, not legacy-specific
  code).
- `.github/workflows/web-ci.yml`: removed the `apps/web/**` path filters and
  `working-directory: apps/web` — CI now runs from the repo root on every
  push/PR.
- `README.md` rewritten for the single-app repo structure; the "two live
  sites, do not touch" warning was removed (it no longer applies to this
  repo) and replaced with an open question about whether the real
  `brandisby` Firebase project's Firestore is still shared with whatever
  now serves Sérac/Fleur De Vie — unconfirmed, flagged rather than assumed
  either way.

## Consequences

- A merge to `main` now deploys the actual discovery platform to this
  repo's Vercel project's production domain, for the first time.
- `docs/architecture-audit.md`, `docs/roadmap.md`, and
  `docs/test-mode-roadmap.md` describe the removed legacy static site and
  the pre-pivot commerce plan; they're left as historical record but are
  now fully superseded — the code they describe no longer exists in this
  repository.
- The `brands` Firestore collection-name collision flagged in ADR 003 is
  **not resolved by this change** — it's about the real Firebase project's
  data, not which repository contains frontend code. Still unconfirmed and
  still blocking a connection to real Firebase credentials; see README.
