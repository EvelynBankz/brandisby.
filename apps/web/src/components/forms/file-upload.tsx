"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  id: string;
  accept?: string;
  multiple?: boolean;
  helpText?: string;
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

// Presentational only — picks files and reports them via onFilesSelected.
// Actually uploading them goes through StorageProvider once that lands
// (M4.1); this component has no opinion on where files end up.
function FileUpload({
  id,
  accept,
  multiple,
  helpText,
  onFilesSelected,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
    onFilesSelected(selected);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesSelected(next);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {multiple ? "Choose files" : "Choose file"}
      </Button>
      {helpText ? <p className="text-sm text-foreground-muted">{helpText}</p> : null}
      {files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-foreground-muted hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { FileUpload };
