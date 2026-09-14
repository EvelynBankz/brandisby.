# 002 — Firebase Authentication (existing project), not Clerk

## Decision

`apps/web` uses Firebase Authentication as its initial auth provider, via the existing `brandisby` Firebase project — not Clerk (which the brief lists only as an example), and not a new, separate Firebase project.

As with every provider in this architecture, business logic depends only on an internal `AuthProvider` interface (`apps/web/src/server/auth/auth-provider.ts`); `FirebaseAuthProvider` is one interchangeable implementation of it. Every user is still stored internally as a Brandisby `User` with `authProvider`/`authProviderUserId` (from M0.2's schema) — nothing outside `firebase-auth-provider.ts` ever sees a Firebase UID directly.

## Reason

1. The brief states "initial authentication **may** use Clerk" — an example, not a requirement (contrast with its much firmer language on Postgres). The user does not have a Clerk account and does have a working Firebase project already.
2. The two live merchant sites (Sérac, Fleur de Vie) already authenticate their owners through this same Firebase project. If/when those two businesses are onboarded onto the new Brandisby platform, their owners can sign in with credentials they already have instead of registering again.
3. The audit's concerns about Firebase were specifically about **Firestore** as the system of record for business data (relational modeling, tenant isolation, order snapshots — see `docs/architecture-audit.md` §3, §13, §14). Firebase *Authentication* is a distinct service within the same project; using it does not reopen any of those findings. PostgreSQL (via Prisma, per ADR-numbered decisions from M0.2) remains the database for every domain table.

## Guardrails (how this stays safe for the two live sites)

- `apps/web` code imports only `firebase-admin/app` and `firebase-admin/auth` — never `firebase-admin/firestore` or `firebase-admin/storage`. `firebase-auth-provider.ts` carries a comment enforcing this; a future PR adding a Firestore/Storage import here should be treated as a bug.
- Any change to the Firebase project's configuration made on this app's behalf (authorized domains, etc.) must be additive-only — never removing or altering what the two live sites depend on.
- The production Firebase Admin credentials (`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`) should come from a **service account scoped to Firebase Authentication Admin only**, not the broader Editor/Owner role the existing `api/*.js` functions' service account may have — this is a to-do for whoever provisions those credentials (see README "Next step").
- Local development and CI never touch the real project at all: both run against the Firebase **Auth Emulator** with a `demo-brandisby` project ID, which Firebase treats as fully offline (`firebase.json`, `.firebaserc`). `npm run test` wraps `vitest run` in `firebase emulators:exec`, and the M0.3 integration test (`user.service.test.ts`) creates its own throwaway user via the emulator's REST API and verifies the real `verifyIdToken` code path — no mocking, no real credentials needed.

## Alternatives Considered

- **Clerk**, as the brief's example. Rejected: requires a new account/service the user doesn't have, with no compensating benefit here — the internal `User` abstraction makes the specific provider a swappable detail either way.
- **A new, separate Firebase project** for `apps/web`, isolating it entirely from the two live sites. Considered safer in isolation, but rejected in favor of the existing project because reusing it materially eases a future migration of Sérac/Fleur de Vie onto the new platform, and the guardrails above keep the risk to the live sites at effectively zero (Auth and Firestore are separate services; this app never touches Firestore).

## Consequences

- Provisioning real (non-emulator) credentials means creating a Firebase Authentication Admin-scoped service account on the existing `brandisby` project — not creating a new project, and not reusing the existing `api/*.js` functions' broader service account.
- If Firebase Auth ever needs to be replaced later, only `firebase-auth-provider.ts` and the credential-provisioning step change; `userService`, `userRepository`, and everything above them are unaffected.
