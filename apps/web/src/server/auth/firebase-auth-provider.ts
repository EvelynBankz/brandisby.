import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "@/config/env";
import type { AuthIdentity, AuthProvider } from "./auth-provider";

// Deliberately imports only firebase-admin/app and firebase-admin/auth.
// This must never import firebase-admin/firestore or firebase-admin/storage —
// this app's only relationship to the existing Firebase project is identity;
// the business database is (and stays) PostgreSQL via Prisma.
function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  // FIREBASE_AUTH_EMULATOR_HOST (set in dev/test) makes the Admin SDK talk to
  // a local emulator instead of the real project — no credential needed.
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  }

  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required outside the emulator.",
    );
  }

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export class FirebaseAuthProvider implements AuthProvider {
  readonly name = "firebase";

  async verifyIdToken(idToken: string): Promise<AuthIdentity> {
    const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);

    return {
      providerUserId: decoded.uid,
      email: decoded.email ?? "",
      name: typeof decoded.name === "string" ? decoded.name : undefined,
    };
  }
}
