# BRANDISBY

Brandisby is a curated **discovery and editorial platform** for Nigerian
brands, startups, founders, and creators — not ecommerce, no merchant
dashboards, no checkout. See `docs/decisions/003-discovery-platform-pivot.md`
for how this replaced an earlier commerce-platform direction,
`docs/decisions/004-repo-restructure.md` for how this became a single
repository-root app, and `docs/discovery-platform-roadmap.md` for the
current build plan.

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

**Before that step, confirm what else uses the real `brandisby` Firebase
project.** Sérac and Fleur De Vie's live sites live in a separate
repository and deploy straight to their own domain via Vercel — they are
not part of this repo. Whether they (or anything else) still read/write
the real `brandisby` project's Firestore under a top-level `brands`
collection is unconfirmed as of this repo's restructure; if so, this app's
own `brands` collection (unrelated editorial schema: `tagline`, `story`,
`founderIds`, etc.) could collide with it. This has only ever run against
the local Firestore emulator specifically to avoid that risk — verify and,
if needed, resolve the naming collision before connecting real Firebase
credentials.
