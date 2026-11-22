import Link from "next/link";
import { ChevronRight, FileSearch } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/ui/score-ring";
import type { RecentAnalysis } from "@/types/dashboard";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function RecentAnalyses({ items }: { items: RecentAnalysis[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Recent analyses"
        description="Estimated resume scores from your latest uploads"
        action={
          items.length > 0 ? (
            <Link href="/history" className="shrink-0 text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={<FileSearch />}
          title="No analyses yet"
          description="Upload a resume to see your first score, strengths, and suggested fixes."
          action={
            <Link href="/resume-analyzer" className={buttonStyles({})}>
              Analyze a resume
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href="/history"
                className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted"
              >
                <ScoreRing value={item.score} size={48} strokeWidth={5} animate={false} label="" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.targetRole}</p>
                </div>
                <time dateTime={item.analyzedAt} className="hidden text-sm text-muted-foreground sm:block">
                  {dateFormat.format(new Date(item.analyzedAt))}
                </time>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
