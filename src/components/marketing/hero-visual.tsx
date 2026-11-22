import { Check, TriangleAlert } from "lucide-react";
import { Tag } from "@/components/marketing/tag";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";

const skills = ["React", "TypeScript", "REST APIs", "Git"];

/**
 * Decorative product illustration for the hero, built from the real UI components so it always
 * matches the app. It is labelled as an example everywhere it could be mistaken for real results.
 */
export function HeroVisual() {
  return (
    <div
      role="img"
      aria-label="Illustration of a resume analysis with a score ring, extracted skills and feedback, next to a dashboard preview"
      className="relative mx-auto w-full max-w-lg pb-10 sm:pb-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 opacity-80"
        style={{
          background:
            "radial-gradient(closest-side at 30% 32%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 100%), radial-gradient(closest-side at 70% 68%, color-mix(in oklab, var(--accent) 32%, transparent), transparent 100%)",
        }}
      />

      {/* Analyzer card */}
      <div className="relative z-10 rounded-2xl border border-border bg-card p-5 shadow-(--shadow-card) sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Resume analysis</p>
          <Tag tone="neutral">Example, not real data</Tag>
        </div>
        <div className="mt-5 flex items-center gap-5">
          <ScoreRing value={78} size={112} strokeWidth={11} label="Estimated" />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Extracted skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Tag key={s} tone="accent">
                  {s}
                </Tag>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Recommended</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tag tone="warning">+ Docker</Tag>
              <Tag tone="warning">+ CI/CD</Tag>
            </div>
          </div>
        </div>
        <ul className="mt-5 space-y-2 text-sm">
          <li className="flex items-center gap-2.5 rounded-lg bg-success/10 px-3 py-2">
            <Check className="size-4 shrink-0 text-success" />
            Clear section headings
          </li>
          <li className="flex items-center gap-2.5 rounded-lg bg-warning/12 px-3 py-2">
            <TriangleAlert className="size-4 shrink-0 text-warning" />
            Use bullet points instead of long paragraphs
          </li>
        </ul>
      </div>

      {/* Dashboard card, offset behind (hidden on small screens) */}
      <div className="absolute -bottom-0 -right-2 z-20 hidden w-56 rounded-2xl border border-border bg-sidebar p-4 shadow-(--shadow-card) sm:block lg:-right-8">
        <p className="text-xs text-muted-foreground">Roadmap progress, week 3</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">22%</p>
        <Progress value={22} label="Example roadmap progress" tone="success" className="mt-3" />
      </div>
    </div>
  );
}
