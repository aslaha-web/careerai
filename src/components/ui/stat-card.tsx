import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  /** Percent change vs last month. Omit when there is no history yet. */
  change?: number;
  iconClassName?: string;
}

export function StatCard({ label, value, icon, change, iconClassName }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl [&_svg]:size-5",
            iconClassName ?? "bg-primary/12 text-primary",
          )}
        >
          {icon}
        </div>
      </div>
      {change === undefined ? (
        <p className="mt-3 text-xs text-muted-foreground">No history yet</p>
      ) : change === 0 ? (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Minus className="size-3.5" />
          No change vs last month
        </p>
      ) : (
        <p
          className={cn(
            "mt-3 flex items-center gap-1 text-xs font-medium",
            change > 0 ? "text-success" : "text-danger",
          )}
        >
          {change > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {change > 0 ? "+" : ""}
          {change}% vs last month
        </p>
      )}
    </Card>
  );
}
