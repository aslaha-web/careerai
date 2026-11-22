import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // Unique per instance: a gradient defined inside a display:none SVG cannot be
  // referenced by another SVG, so a shared id breaks the second logo on the page.
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f7bff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {/* three rising steps with a spark on the top step */}
      <path d="M7 23h5v-5H7zM13.5 23h5v-9h-5zM20 23h5V9h-5z" fill="#fff" fillOpacity="0.92" />
      <circle cx="22.5" cy="6" r="1.6" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, variant = "default" }: { className?: string; variant?: "default" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">
        Career<span className={variant === "light" ? "text-white/70" : "text-primary"}>AI</span>
      </span>
    </span>
  );
}
