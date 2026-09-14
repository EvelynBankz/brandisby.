import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.ComponentProps<"div"> {
  label: string;
  htmlFor: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

// Presentational only — pairs with plain form state today and with
// react-hook-form + zodResolver once the first real form (M1.1) needs it;
// this component doesn't assume either.
function FormField({
  label,
  htmlFor,
  helpText,
  error,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : helpText ? (
        <p className="text-sm text-foreground-muted">{helpText}</p>
      ) : null}
    </div>
  );
}

export { FormField };
