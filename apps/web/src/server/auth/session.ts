import "server-only";
import { cookies } from "next/headers";
import type { User } from "@/generated/prisma/client";
import { userRepository } from "@/server/users/user.repository";
import { FirebaseAuthProvider } from "./firebase-auth-provider";
import type { AuthProvider } from "./auth-provider";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

// Single shared instance — swapping providers later means changing this one
// line, not every caller of getCurrentUser()/getAuthProvider().
const authProvider: AuthProvider = new FirebaseAuthProvider();

export function getAuthProvider(): AuthProvider {
  return authProvider;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const identity = await authProvider.verifySessionCookie(sessionCookie);
    return await userRepository.findByAuthIdentity(
      authProvider.name,
      identity.providerUserId,
    );
  } catch {
    // Expired/invalid/revoked cookie — treat as signed out rather than error.
    return null;
  }
}
