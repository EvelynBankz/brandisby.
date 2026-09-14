export interface AuthIdentity {
  providerUserId: string;
  email: string;
  name?: string;
}

// Business logic (userService, and everything above it) depends on this
// interface only, never on `firebase-admin` directly — swapping the auth
// provider later means writing a new adapter, not touching callers.
export interface AuthProvider {
  readonly name: string;
  verifyIdToken(idToken: string): Promise<AuthIdentity>;
  // Long-lived (cookie) session, separate from the short-lived ID token the
  // client gets at sign-in — this is what the httpOnly session cookie holds.
  createSessionCookie(idToken: string, expiresInMs: number): Promise<string>;
  verifySessionCookie(sessionCookie: string): Promise<AuthIdentity>;
}
