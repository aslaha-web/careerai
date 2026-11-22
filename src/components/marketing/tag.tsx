import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Small pill for the public pages. Same look as the app's Badge, but the text colours come from
 * the AA-contrast tokens (text-brand, text-accent-text, ...) so every tone passes WCAG in both themes.
 */
const tagVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      primary: "bg-primary/12 text-brand",
      accent: "bg-accent/12 text-accent-text",
      success: "bg-success/12 text-success-text",
      warning: "bg-warning/15 text-warning-text",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Tag({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagVariants>) {
  return <span className={cn(tagVariants({ tone }), className)} {...props} />;
}
