# BRANDISBY

Brandisby is a curated **discovery and editorial platform** for Nigerian
brands, startups, founders, and creators — not ecommerce, no merchant
dashboards, no checkout. See `docs/decisions/003-discovery-platform-pivot.md`
for how this replaced an earlier commerce-platform direction,
`docs/decisions/004-repo-restructure.md` for how this became a single
repository-root app, `docs/decisions/005-discoverybrands-collection-rename.md`
for why its Firestore collection is `discoveryBrands` and not `brands`, and
`docs/discovery-platform-roadmap.md` for the current build plan.

Stack: Next.js/TypeScript/Tailwind, **Firestore** as the database, Firebase
Authentication for internal/admin login only (no public reader accounts),
no file storage yet (image URLs only, structured so Storage can be added
later without a rebuild).

## Setup

```bash
npm install
cp .env.example .env    # demo/emulator values work out of the box
npx firebase emulators:start --only auth,firestore --project demo-brandisby   # separate terminal, needed for `dev`
npm run seed:emulator   # sample brands/categories/founders/startups/creators for local dev
npm run dev              # http://localhost:3000
npm run typecheck
npm run lint
npm run test              # wraps the Auth + Firestore emulators itself — no real credentials needed
npm run build
```

## Deployment

This repo's connected Vercel project builds from the repository root, so a
merge to `main` deploys this app directly — no extra Root Directory
configuration needed (see `docs/decisions/004-repo-restructure.md` for why
that mattered).

**Next step (blocking a real deployment):** a Firebase service account
scoped narrowly (Firestore + Firebase Authentication Admin — not a broad
Owner/Editor role) needs to be created on the real `brandisby` Firebase
project, for `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` — see
`.env.example`. Until then, everything only runs against the local
emulators.

**Collection-name collision — resolved.** Sérac's and Fleur De Vie's live
sites (`EvelynBankz/serac`, `EvelynBankz/fleurdevie` — separate
repositories, deployed straight to their own domains via Vercel) both use
the real `brandisby` Firebase project and write live order/quote data
under `brands/{slug}/{orders,quotes}`. This app's own collection is
`discoveryBrands`, not `brands`, specifically to avoid colliding with that
— see `docs/decisions/005-discoverybrands-collection-rename.md` for the
full investigation and reasoning. Safe to connect this app to the real
`brandisby` project once the service account above exists.
