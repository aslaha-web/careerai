import Link from "next/link";
import { Route } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import type { RoadmapSummary } from "@/types/dashboard";

export function RoadmapProgress({ roadmap }: { roadmap: RoadmapSummary | null }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader title="Learning roadmap" description={roadmap ? roadmap.title : "No active roadmap"} />
      {roadmap ? (
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-semibold tracking-tight">
              {Math.round((roadmap.completedTasks / roadmap.totalTasks) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Week {roadmap.currentWeek} of {roadmap.totalWeeks}
            </p>
          </div>
          <Progress
            className="mt-3"
            tone="success"
            label="Roadmap completion"
            value={(roadmap.completedTasks / roadmap.totalTasks) * 100}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            {roadmap.completedTasks} of {roadmap.totalTasks} tasks completed
          </p>
          <Link href="/learning-roadmap" className={buttonStyles({ variant: "outline", className: "mt-5 w-full" })}>
            Continue learning
          </Link>
        </div>
      ) : (
        <EmptyState
          className="mt-5 px-4 py-8"
          icon={<Route />}
          title="Start a roadmap"
          description="Choose a target role and get a weekly plan."
          action={
            <Link href="/learning-roadmap" className={buttonStyles({ size: "sm" })}>
              Create roadmap
            </Link>
          }
        />
      )}
    </Card>
  );
}
