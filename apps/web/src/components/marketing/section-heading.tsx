import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
}

function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-2", align === "center" && "items-center")}>
        {kicker ? (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground-muted">
            {kicker}
          </p>
        ) : null}
        <h2 className="font-serif text-3xl font-medium text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className={cn("max-w-2xl text-foreground-muted", align === "center" && "mx-auto")}>
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export { SectionHeading };
