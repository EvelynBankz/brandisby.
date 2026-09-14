import { z } from "zod";

// Keep in sync with docs/roadmap.md's business-handle notes. Add to this list
// rather than trying to be clever about detecting reserved words.
export const RESERVED_SLUGS = new Set([
  "admin",
  "platform-admin",
  "api",
  "support",
  "help",
  "billing",
  "dashboard",
  "login",
  "signup",
  "logout",
  "www",
  "app",
  "static",
  "assets",
  "onboarding",
  "auth",
  "dev",
  "mail",
  "ftp",
  "blog",
  "docs",
]);

export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const slugSchema = z
  .string()
  .min(3, "Handle must be at least 3 characters")
  .max(40, "Handle must be at most 40 characters")
  .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens")
  .refine((slug) => !RESERVED_SLUGS.has(slug), { message: "That handle is reserved" });

export const businessCreateSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(80),
  slug: slugSchema,
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex colour, e.g. #2B2118")
    .optional(),
  description: z.string().trim().max(280, "Keep it under 280 characters").optional(),
});

export type BusinessCreateInput = z.infer<typeof businessCreateSchema>;
