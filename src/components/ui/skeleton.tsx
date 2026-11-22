import { cn } from "@/lib/utils";

/** Loading placeholder. Pulse is disabled automatically for reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-muted motion-reduce:animate-none", className)}
    />
  );
}
