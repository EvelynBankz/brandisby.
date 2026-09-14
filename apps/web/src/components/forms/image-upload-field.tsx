"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ImageUploadFieldProps {
  id: string;
  value?: string;
  onChange: (url: string) => void;
  upload: (file: File) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  className?: string;
}

// Wires the presentational FileUpload pattern to a real upload — pass the
// server action to call (uploadBusinessLogoAction, uploadWebsiteSectionImageAction,
// etc.) so this component has no opinion on what it's uploading or where.
function ImageUploadField({ id, value, onChange, upload, className }: ImageUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    const result = await upload(file);
    setUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.url);
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-muted">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote R2 URL, not a local asset
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImageOff className="size-5 text-foreground-muted" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          className="sr-only"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : value ? "Change image" : "Upload image"}
        </Button>
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { ImageUploadField };
