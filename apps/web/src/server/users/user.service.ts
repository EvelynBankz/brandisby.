import type { AuthProvider } from "@/server/auth/auth-provider";
import { userRepository } from "./user.repository";

// The only place that turns a verified auth-provider identity into an
// internal Brandisby User. Everything else in the app references User.id,
// never a provider's own uid, per the brief's auth-portability rule.
export const userService = {
  async syncFromAuthProvider(provider: AuthProvider, idToken: string) {
    const identity = await provider.verifyIdToken(idToken);

    return userRepository.upsert({
      authProvider: provider.name,
      authProviderUserId: identity.providerUserId,
      email: identity.email,
      name: identity.name ?? null,
    });
  },
};
