import { Card, CardHeader } from "@/components/ui/card";
import type { ActivityItem } from "@/types/dashboard";

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader title="Recent activity" />
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing yet. Your activity will show up here.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              <div>
                <p className="text-sm">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.when}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
