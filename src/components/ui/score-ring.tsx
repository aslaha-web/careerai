import { useId } from "react";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string; // small text under the number, e.g. "Match"
  className?: string;
  animate?: boolean;
}

/**
 * Circular score indicator (purple gradient, inspired by the analyzer reference).
 * Pure SVG, no chart library. Reused later by the Resume Analyzer page.
 */
export function ScoreRing({
  value,
  size = 160,
  strokeWidth = 14,
  label,
  className,
  animate = true,
}: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const gradientId = useId();

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"}: ${Math.round(clamped)} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#4f7bff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={animate ? "ring-animate" : undefined}
          style={{ ["--ring-circumference" as string]: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold tracking-tight" style={{ fontSize: size * 0.28 }}>
          {Math.round(clamped)}
          <span className="text-muted-foreground" style={{ fontSize: size * 0.13 }}>
            %
          </span>
        </span>
        {label ? (
          <span className="text-xs text-muted-foreground" style={{ fontSize: size * 0.085 }}>
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
