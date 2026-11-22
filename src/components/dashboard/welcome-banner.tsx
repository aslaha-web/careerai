"use client";

import Link from "next/link";
import * as React from "react";
import { MessagesSquare, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { formatLongDate, getGreeting } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * The greeting and date depend on the visitor's clock, so they are filled in
 * after mount. Rendering them on the server would mismatch the browser's time zone.
 */
export function WelcomeBanner({ firstName }: { firstName: string }) {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => setNow(new Date()), []);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-banner-from to-banner-to p-6 text-white shadow-(--shadow-card) sm:p-8">
      {/* decorative rings, pure CSS */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[28px] border-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 right-24 size-64 rounded-full bg-violet-400/25 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className={cn("min-h-5 text-sm text-white/80", !now && "invisible")}>
            {now ? formatLongDate(now) : "Today"}
          </p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {now ? getGreeting(now) : "Welcome back"}, {firstName}
          </h1>
          <p className="mt-2 text-white/85">
            Review your latest resume score, close one skill gap this week, and keep your roadmap moving.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/resume-analyzer" className={buttonStyles({ variant: "inverse", size: "lg" })}>
            <Sparkles />
            New analysis
          </Link>
          <Link
            href="/interview-prep"
            className={buttonStyles({ size: "lg", className: "bg-white/15 text-white hover:bg-white/25" })}
          >
            <MessagesSquare />
            Practice interview
          </Link>
        </div>
      </div>
    </section>
  );
}
