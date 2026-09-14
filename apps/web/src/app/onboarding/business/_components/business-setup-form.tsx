"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";
import { checkBusinessSlugAction, createBusinessAction } from "@/server/businesses/actions";

const DEFAULT_BRAND_COLOR = "#2b2118";

export function BusinessSetupForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [brandColor, setBrandColor] = React.useState(DEFAULT_BRAND_COLOR);
  const [description, setDescription] = React.useState("");

  const [slugCheck, setSlugCheck] = React.useState<{
    checking: boolean;
    normalized: string;
    available: boolean | null;
    error?: string;
  }>({ checking: false, normalized: "", available: null });

  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const trimmedSlug = slug.trim();

  React.useEffect(() => {
    if (!trimmedSlug) return;

    // setState only runs inside this async callback, never synchronously in
    // the effect body — avoids the cascading-render footgun for debounce.
    const timeout = setTimeout(async () => {
      setSlugCheck((prev) => ({ ...prev, checking: true }));
      const result = await checkBusinessSlugAction(trimmedSlug);
      setSlugCheck({
        checking: false,
        normalized: result.normalized,
        available: result.error ? null : result.available,
        error: result.error,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [trimmedSlug]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const result = await createBusinessAction({
      name,
      slug,
      brandColor,
      description: description.trim() || undefined,
    });

    if (!result.ok) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const canSubmit = name.trim().length >= 2 && slugCheck.available === true && !submitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField label="Business name" htmlFor="business-name" required>
        <Input
          id="business-name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Goldmakers"
        />
      </FormField>

      <FormField
        label="Your Brandisby link"
        htmlFor="business-slug"
        required
        error={trimmedSlug ? slugCheck.error : undefined}
        helpText={
          trimmedSlug && !slugCheck.error && slugCheck.normalized
            ? `${slugCheck.normalized}.brandisby.com`
            : "Letters, numbers, and hyphens only"
        }
      >
        <div className="relative">
          <Input
            id="business-slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="goldmakers"
            aria-invalid={!!(trimmedSlug && (slugCheck.error || slugCheck.available === false))}
          />
          {trimmedSlug && !slugCheck.checking ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {slugCheck.available === true ? (
                <Check className="size-4 text-success" />
              ) : slugCheck.available === false || slugCheck.error ? (
                <X className="size-4 text-error" />
              ) : null}
            </span>
          ) : null}
        </div>
        {trimmedSlug && slugCheck.available === false && !slugCheck.error ? (
          <p className="text-sm text-error">
            {slugCheck.normalized}.brandisby.com is already taken.
          </p>
        ) : null}
      </FormField>

      <FormField label="Brand colour" htmlFor="business-color">
        <div className="flex items-center gap-3">
          <input
            id="business-color"
            type="color"
            value={brandColor}
            onChange={(event) => setBrandColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-input bg-surface p-1"
          />
          <span className="text-sm text-foreground-muted">{brandColor}</span>
        </div>
      </FormField>

      <FormField
        label="About your business"
        htmlFor="business-description"
        helpText="A short line customers will see — you can change this later."
      >
        <Textarea
          id="business-description"
          maxLength={280}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Handmade personalized journals and stationery."
        />
      </FormField>

      <p className="text-sm text-foreground-muted">
        Logo upload isn&apos;t connected yet — you&apos;ll be able to add one soon.
      </p>

      {formError ? (
        <p className="text-sm text-error" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit}>
        {submitting ? "Creating your business…" : "Create business"}
      </Button>
    </form>
  );
}
