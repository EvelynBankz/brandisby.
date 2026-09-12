import { prisma } from "@/server/db/client";
import type { User } from "@/generated/prisma/client";

export const userRepository = {
  findByAuthIdentity(
    authProvider: string,
    authProviderUserId: string,
  ): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        authProvider_authProviderUserId: { authProvider, authProviderUserId },
      },
    });
  },

  upsert(data: {
    authProvider: string;
    authProviderUserId: string;
    email: string;
    name?: string | null;
  }): Promise<User> {
    return prisma.user.upsert({
      where: {
        authProvider_authProviderUserId: {
          authProvider: data.authProvider,
          authProviderUserId: data.authProviderUserId,
        },
      },
      update: { email: data.email, name: data.name ?? undefined },
      create: data,
    });
  },
};
