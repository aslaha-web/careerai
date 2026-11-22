import Link from "next/link";
import { Target } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import type { SkillGap } from "@/types/dashboard";

export function SkillGaps({ gaps }: { gaps: SkillGap[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader title="Skills to strengthen" description="Biggest gaps for your target role" />
      {gaps.length === 0 ? (
        <EmptyState
          className="mt-5 px-4 py-8"
          icon={<Target />}
          title="No skill gaps yet"
          description="Pick a target role to see which skills to build next."
          action={
            <Link href="/skill-gap" className={buttonStyles({ variant: "outline", size: "sm" })}>
              Find skill gaps
            </Link>
          }
        />
      ) : (
        <ul className="mt-5 space-y-5">
          {gaps.map((gap) => (
            <li key={gap.skill}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{gap.skill}</span>
                <span className="text-muted-foreground">{gap.gapPercent}% gap</span>
              </div>
              <Progress value={gap.gapPercent} label={`${gap.skill} gap`} tone="accent" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
