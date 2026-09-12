import { businessRepository } from "./business.repository";

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`Business slug "${slug}" is already taken.`);
    this.name = "SlugTakenError";
  }
}

// Deliberately minimal for M0.2 — real handle normalization, the reserved-word
// list, and availability-check UX land in M1.1. This exists to prove the
// UI -> service -> repository -> Prisma layering end to end.
export const businessService = {
  async isSlugAvailable(slug: string): Promise<boolean> {
    return (await businessRepository.findBySlug(slug)) === null;
  },

  async registerBusiness(input: { name: string; slug: string }) {
    if (!(await businessService.isSlugAvailable(input.slug))) {
      throw new SlugTakenError(input.slug);
    }
    return businessRepository.create(input);
  },
};
