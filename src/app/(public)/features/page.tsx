import type { Metadata } from "next";
import { Check } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { FeaturePreview } from "@/components/marketing/feature-preview";
import { Container, SectionHeading } from "@/components/marketing/section";
import { Tag } from "@/components/marketing/tag";
import { featureIcons } from "@/components/marketing/feature-icons";
import { features } from "@/config/features";
import { getCurrentUser } from "@/server/auth/dal";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Resume analysis, skill gap finding, role recommendations, interview practice, learning roadmaps and a progress dashboard in one place.",
};

export default async function FeaturesPage() {
  const user = await getCurrentUser();

  return (
    <>
      <Container className="pb-4 pt-14 sm:pt-20">
        <SectionHeading
          as="h1"
          title="Tools for every step between your resume and your next role"
          description="Each tool builds on the same profile, so what you learn in one place carries into the next."
        />
      </Container>

      <div className="mx-auto max-w-6xl space-y-20 px-5 py-16 sm:space-y-28 sm:px-8 sm:py-24">
        {features.map((feature, i) => {
          const Icon = featureIcons[feature.icon];
          return (
            <article
              key={feature.id}
              id={feature.id}
              className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary [&_svg]:size-5">
                    <Icon />
                  </span>
                  {feature.status === "coming-soon" ? <Tag tone="neutral">Coming soon</Tag> : null}
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{feature.title}</h2>
                <p className="mt-3 text-lg text-muted-foreground text-pretty">{feature.summary}</p>
                <ul className="mt-6 space-y-3">
                  {feature.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {feature.note ? (
                  <p className="mt-6 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    {feature.note}
                  </p>
                ) : null}
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                <FeaturePreview id={feature.id} />
              </div>
            </article>
          );
        })}
      </div>

      <CtaBand signedIn={Boolean(user)} />
    </>
  );
}
