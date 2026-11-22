import { Check } from "lucide-react";
import { Tag } from "@/components/marketing/tag";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import type { Feature } from "@/config/features";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-card) sm:p-6">
      <div className="mb-4 flex justify-end">
        <Tag tone="neutral">Illustration, not real data</Tag>
      </div>
      {children}
    </div>
  );
}

function ResumePreview() {
  return (
    <div className="flex items-center gap-5">
      <ScoreRing value={78} size={104} strokeWidth={10} label="Estimated" />
      <div className="min-w-0 space-y-3 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {["JavaScript", "React", "SQL"].map((s) => (
            <Tag key={s} tone="accent">
              {s}
            </Tag>
          ))}
        </div>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Check className="size-4 text-success" /> Contact details found
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Tag tone="warning">Missing</Tag> Summary section
        </p>
      </div>
    </div>
  );
}

function SkillGapPreview() {
  const rows = [
    { skill: "TypeScript", have: 80 },
    { skill: "Testing", have: 35 },
    { skill: "Docker", have: 15 },
  ];
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.skill}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium">{r.skill}</span>
            <span className="text-muted-foreground">{r.have}% of required level</span>
          </div>
          <Progress value={r.have} label={`${r.skill} example level`} tone="accent" />
        </li>
      ))}
    </ul>
  );
}

function JobRolesPreview() {
  const roles = [
    { title: "Frontend Developer", match: 86 },
    { title: "Full Stack Developer", match: 71 },
    { title: "UI Engineer", match: 64 },
  ];
  return (
    <ul className="space-y-2.5">
      {roles.map((r) => (
        <li key={r.title} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium">
          {r.title}
          <Tag tone="primary">{r.match}% match</Tag>
        </li>
      ))}
      <li className="pt-1 text-xs text-muted-foreground">AI suggestions, not live job listings.</li>
    </ul>
  );
}

function InterviewPreview() {
  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium">Tell me about a time you fixed a difficult bug.</p>
      <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-muted-foreground">
        I traced the issue to a stale cache entry, wrote a failing test, then fixed it...
      </div>
      <div className="flex items-center gap-2">
        <Tag tone="success">Clear structure</Tag>
        <Tag tone="warning">Add a measurable result</Tag>
      </div>
    </div>
  );
}

function RoadmapPreview() {
  const tasks = [
    { t: "Finish the TypeScript handbook chapters", done: true },
    { t: "Build a small typed API client", done: true },
    { t: "Write tests for it with Vitest", done: false },
  ];
  return (
    <div>
      <p className="mb-3 text-sm font-medium">Week 3</p>
      <ul className="space-y-2.5">
        {tasks.map((task) => (
          <li key={task.t} className="flex items-center gap-3 text-sm">
            <span
              aria-hidden
              className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                task.done ? "border-success bg-success text-white" : "border-border"
              }`}
            >
              {task.done ? <Check className="size-3.5" /> : null}
            </span>
            <span className={task.done ? "text-muted-foreground line-through" : ""}>{task.t}</span>
          </li>
        ))}
      </ul>
      <Progress className="mt-4" value={67} label="Example week progress" tone="success" />
    </div>
  );
}

function DashboardPreview() {
  const bars = [2, 0, 3, 1, 4, 2, 0];
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Analyses", "12"],
          ["Avg. score", "74%"],
          ["Saved roles", "8"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border px-3 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-5 flex h-20 items-end gap-2">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-linear-to-t from-primary to-accent"
            style={{ height: b === 0 ? "4px" : `${(b / 4) * 100}%`, opacity: b === 0 ? 0.25 : 1 }}
          />
        ))}
      </div>
    </div>
  );
}

const previews: Record<Feature["id"], () => React.JSX.Element> = {
  "resume-analyzer": ResumePreview,
  "skill-gap": SkillGapPreview,
  "job-roles": JobRolesPreview,
  "interview-prep": InterviewPreview,
  roadmap: RoadmapPreview,
  dashboard: DashboardPreview,
};

export function FeaturePreview({ id }: { id: Feature["id"] }) {
  const Preview = previews[id];
  return (
    <Frame>
      <Preview />
    </Frame>
  );
}
