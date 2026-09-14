import { businessRepository } from "./business.repository";
import { businessCreateSchema, normalizeSlug, slugSchema } from "./business.schema";

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`Business slug "${slug}" is already taken.`);
    this.name = "SlugTakenError";
  }
}

export class InvalidBusinessInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBusinessInputError";
  }
}

export interface RegisterBusinessInput {
  ownerId: string;
  name: string;
  slug: string;
  brandColor?: string;
  description?: string;
}

export interface SlugCheckResult {
  normalized: string;
  available: boolean;
  error?: string;
}

export const businessService = {
  async isSlugAvailable(slug: string): Promise<boolean> {
    return (await businessRepository.findBySlug(slug)) === null;
  },

  // Used for the real-time "is this handle available" check in the business
  // setup form — normalizes first so what the merchant sees matches what
  // would actually be saved.
  async checkSlug(rawSlug: string): Promise<SlugCheckResult> {
    const normalized = normalizeSlug(rawSlug);
    const parsed = slugSchema.safeParse(normalized);
    if (!parsed.success) {
      return {
        normalized,
        available: false,
        error: parsed.error.issues[0]?.message ?? "Invalid handle",
      };
    }
    return { normalized, available: await businessService.isSlugAvailable(normalized) };
  },

  async getBusinessForUser(userId: string) {
    return businessRepository.findFirstForUser(userId);
  },

  async registerBusiness(input: RegisterBusinessInput) {
    const normalizedSlug = normalizeSlug(input.slug);
    const parsed = businessCreateSchema.safeParse({ ...input, slug: normalizedSlug });
    if (!parsed.success) {
      throw new InvalidBusinessInputError(
        parsed.error.issues[0]?.message ?? "Invalid business details",
      );
    }

    if (!(await businessService.isSlugAvailable(parsed.data.slug))) {
      throw new SlugTakenError(parsed.data.slug);
    }

    return businessRepository.createWithOwner(input.ownerId, parsed.data);
  },
};
