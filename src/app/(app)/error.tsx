"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlert />}
      title="This page could not load"
      description="Something went wrong on our side. Try again, and if it keeps happening, come back in a few minutes."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
