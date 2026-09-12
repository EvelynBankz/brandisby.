import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { FirebaseAuthProvider } from "@/server/auth/firebase-auth-provider";
import { userService } from "./user.service";

// Integration test: exercises AuthProvider.verifyIdToken -> userService ->
// Prisma -> PostgreSQL against a real Firebase Auth Emulator (never the real
// Firebase project — run via `npm run test`, which wraps this in
// `firebase emulators:exec`) and a real Postgres.
const EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const email = `test-${randomUUID()}@example.com`;

async function createEmulatorUser() {
  const res = await fetch(
    `http://${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", returnSecureToken: true }),
    },
  );
  if (!res.ok) {
    throw new Error(`Emulator signUp failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{ idToken: string; localId: string }>;
}

describe.skipIf(!EMULATOR_HOST)("userService.syncFromAuthProvider (Firebase)", () => {
  const provider = new FirebaseAuthProvider();

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("verifies the emulator ID token and upserts an internal User", async () => {
    const { idToken, localId } = await createEmulatorUser();

    const user = await userService.syncFromAuthProvider(provider, idToken);

    expect(user.authProvider).toBe("firebase");
    expect(user.authProviderUserId).toBe(localId);
    expect(user.email).toBe(email);

    // Re-syncing the same identity updates, not duplicates.
    const again = await userService.syncFromAuthProvider(provider, idToken);
    expect(again.id).toBe(user.id);
  });
});
