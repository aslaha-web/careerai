import Link from "next/link";
import { Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

/** Honest stand-in for pages that are built in later steps. Replaced, not extended. */
export function FeaturePlaceholder({
  title,
  description,
  step,
}: {
  title: string;
  description: string;
  step: number;
}) {
  return (
    <>
      <PageHeader title={title} description={description} action={<Badge tone="warning">Not built yet</Badge>} />
      <EmptyState
        icon={<Hammer />}
        title={`${title} arrives in Step ${step}`}
        description="This page is part of the build plan. The layout, navigation and theme are ready for it."
        action={
          <Link href="/dashboard" className={buttonStyles({ variant: "outline" })}>
            Back to dashboard
          </Link>
        }
      />
    </>
  );
}
