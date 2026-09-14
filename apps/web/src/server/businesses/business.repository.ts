import { prisma } from "@/server/db/client";
import type { Business } from "@/generated/prisma/client";

export interface CreateBusinessData {
  name: string;
  slug: string;
  brandColor?: string;
  description?: string;
}

export const businessRepository = {
  findBySlug(slug: string): Promise<Business | null> {
    return prisma.business.findUnique({ where: { slug } });
  },

  findFirstForUser(userId: string): Promise<Business | null> {
    return prisma.business.findFirst({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: "asc" },
    });
  },

  create(data: CreateBusinessData): Promise<Business> {
    return prisma.business.create({ data });
  },

  // Creates the Business and its owner's BusinessMembership together so a
  // business can never exist without an owner, or vice versa.
  createWithOwner(ownerId: string, data: CreateBusinessData): Promise<Business> {
    return prisma.$transaction(async (tx) => {
      const business = await tx.business.create({ data });
      await tx.businessMembership.create({
        data: { userId: ownerId, businessId: business.id, role: "OWNER" },
      });
      return business;
    });
  },
};
