"use server";

import { getCurrentUser } from "@/server/auth/session";
import {
  businessService,
  InvalidBusinessInputError,
  SlugTakenError,
  type SlugCheckResult,
} from "./business.service";

export async function checkBusinessSlugAction(rawSlug: string): Promise<SlugCheckResult> {
  return businessService.checkSlug(rawSlug);
}

export type CreateBusinessResult =
  | { ok: true }
  | { ok: false; error: string; field?: "name" | "slug" };

export async function createBusinessAction(input: {
  name: string;
  slug: string;
  brandColor?: string;
  description?: string;
}): Promise<CreateBusinessResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  try {
    await businessService.registerBusiness({ ownerId: user.id, ...input });
  } catch (error) {
    if (error instanceof SlugTakenError) {
      return { ok: false, error: error.message, field: "slug" };
    }
    if (error instanceof InvalidBusinessInputError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  return { ok: true };
}
