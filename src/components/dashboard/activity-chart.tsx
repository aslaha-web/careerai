import { Card, CardHeader } from "@/components/ui/card";
import type { ActivityDay } from "@/types/dashboard";

/** Seven-day bar chart built from plain divs so it follows the theme with no chart library. */
export function ActivityChart({ days }: { days: ActivityDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader title="This week" description={`${total} activities in the last 7 days`} />
      <div
        role="img"
        aria-label={`Activity by day: ${days.map((d) => `${d.day} ${d.count}`).join(", ")}`}
        className="mt-6 flex h-36 items-end gap-2"
      >
        {days.map((d) => (
          <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-t-md bg-linear-to-t from-primary to-accent"
              style={{ height: d.count === 0 ? "4px" : `${(d.count / max) * 100}%`, opacity: d.count === 0 ? 0.25 : 1 }}
            />
            <span className="text-xs text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
