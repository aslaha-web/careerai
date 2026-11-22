import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  label: string; // accessible name
  className?: string;
  tone?: "primary" | "accent" | "success";
}

const toneClass = {
  primary: "bg-primary",
  accent: "bg-linear-to-r from-primary to-accent",
  success: "bg-success",
};

export function Progress({ value, label, className, tone = "primary" }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", toneClass[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
