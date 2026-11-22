import Link from "next/link";
import { Tag } from "@/components/marketing/tag";
import type { Feature } from "@/config/features";
import { featureIcons } from "./feature-icons";

export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = featureIcons[feature.icon];
  return (
    <Link
      href={`/features#${feature.id}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card) transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground [&_svg]:size-5">
          <Icon />
        </span>
        {feature.status === "coming-soon" ? <Tag tone="neutral">Coming soon</Tag> : null}
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{feature.summary}</p>
    </Link>
  );
}
