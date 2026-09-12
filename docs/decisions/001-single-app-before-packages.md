# 001 — Start as a single `apps/web` app, defer `packages/*` workspaces

## Decision

M0.1 scaffolds the new Brandisby application as a single, self-contained Next.js app at `apps/web`, with its own `package.json`/lockfile and no npm/pnpm workspace configuration at the repo root. Domain separation (auth, payments, storage, email, etc.) will be expressed as internal folders inside `apps/web/src` until a second deployable app (e.g. `apps/platform-admin`) or a genuine cross-app sharing need makes a real `packages/*` workspace worth its overhead.

## Reason

1. The engineering brief explicitly allows this: "the exact monorepo tooling may be selected based on the existing codebase... do not introduce monorepo complexity if the existing project is too early to justify it. However, maintain clear domain separation even if everything currently exists inside one Next.js application."
2. There are currently two live merchant websites (Sérac and Fleur de Vie) already deployed from the repository root and connected to the existing Firebase project `brandisby` in Firestore. They must not be altered or put at risk. Touching the **root** `package.json` to add `workspaces` would change how the root install resolves for everything under it — including `api/*.js`, which those two live sites' checkout flows depend on. Keeping `apps/web` fully self-contained (its own `package.json`, its own `node_modules`, its own lockfile) means the new app cannot affect the existing deployment's install, build, or runtime behavior at all.
3. There is nothing to share across packages yet — no second app, no reused business logic outside `apps/web`. Introducing empty `packages/ui`, `packages/database`, etc. now would be scaffolding without content.

## Alternatives Considered

- **Turborepo + `packages/*` from day one**, matching the brief's suggested folder layout literally. Rejected for now: adds root-level configuration (workspace fields, a `turbo.json`, install-time coupling) for zero present benefit, and increases the surface area touched at the repo root while the two live sites still depend on today's root `package.json`.
- **Editing the current root `package.json` in place** (adding `workspaces`) instead of a separate app-local `package.json`. Rejected: even an additive change to the root manifest changes how `npm install` resolves at the root, which is exactly the risk this decision is written to avoid.

## Consequences

- Every command for the new app runs from `apps/web` (`npm run dev`, `npm run build`, etc.), not from the repo root.
- When a second app or genuine shared package is needed, revisit this decision: extract the relevant `apps/web/src/*` folder(s) into `packages/*`, introduce workspace tooling at that point, and record the follow-up as a new ADR rather than editing this one.
- CI (`.github/workflows/web-ci.yml`) is scoped with `working-directory: apps/web` and path filters on `apps/web/**`, so it never runs against, or interferes with, the legacy static site or its `api/` serverless functions.
- The new app must not share credentials, provider config, or a database with the existing Firebase project `brandisby` — it gets its own environment variables and, from M0.2 onward, its own PostgreSQL database. No code in `apps/web` should ever reference `firebase`/`firestore` for the two existing merchant sites' data.
