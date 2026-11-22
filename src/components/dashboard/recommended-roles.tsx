import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { RecommendedRole } from "@/types/dashboard";

export function RecommendedRoles({ roles }: { roles: RecommendedRole[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader title="Recommended roles" description="AI suggestions, not live job listings" />
      {roles.length === 0 ? (
        <EmptyState
          className="mt-5 px-4 py-8"
          icon={<Briefcase />}
          title="No suggestions yet"
          description="Add your skills to get role suggestions."
          action={
            <Link href="/job-recommendations" className={buttonStyles({ size: "sm" })}>
              Get suggestions
            </Link>
          }
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {roles.map((role) => (
            <li key={role.title}>
              <Link
                href="/job-recommendations"
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                {role.title}
                <Badge tone="primary">{role.matchPercent}% match</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
