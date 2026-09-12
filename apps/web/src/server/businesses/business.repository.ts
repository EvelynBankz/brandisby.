import { prisma } from "@/server/db/client";
import type { Business } from "@/generated/prisma/client";

export const businessRepository = {
  findBySlug(slug: string): Promise<Business | null> {
    return prisma.business.findUnique({ where: { slug } });
  },

  create(data: { name: string; slug: string }): Promise<Business> {
    return prisma.business.create({ data });
  },
};
