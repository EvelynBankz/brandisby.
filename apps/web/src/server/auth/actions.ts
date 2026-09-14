"use server";

import { cookies } from "next/headers";
import { userService } from "@/server/users/user.service";
import { getAuthProvider, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "./session";

export type CreateSessionResult = { ok: true } | { ok: false; error: string };

// Called right after the client signs in/up with the Firebase client SDK.
// Verifies the ID token, syncs the internal User row, then issues our own
// long-lived httpOnly session cookie (the ID token itself only lasts ~1hr).
export async function createSessionAction(idToken: string): Promise<CreateSessionResult> {
  try {
    const provider = getAuthProvider();
    await userService.syncFromAuthProvider(provider, idToken);

    const sessionCookie = await provider.createSessionCookie(idToken, SESSION_MAX_AGE_MS);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS / 1000,
      path: "/",
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sign-in failed.",
    };
  }
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
