import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AiUsage } from "@/types/dashboard";

export function UsageStrip({ usage }: { usage: AiUsage }) {
  const remaining = Math.max(0, usage.limit - usage.used);
  const percent = (usage.used / usage.limit) * 100;
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-4 sm:w-72">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Zap className="size-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">AI requests today</p>
            <Badge tone="accent">Free tier</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{remaining}</span> of {usage.limit} remaining
          </p>
        </div>
      </div>
      <div className="flex-1">
        <Progress value={percent} tone="accent" label="AI requests used today" />
        <p className="mt-2 text-xs text-muted-foreground">
          Daily limits keep the app free to run. They reset every day.
        </p>
      </div>
    </Card>
  );
}
