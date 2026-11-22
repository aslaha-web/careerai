import type { Metadata } from "next";
import { Compass, GraduationCap, Rocket } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container, Section, SectionHeading } from "@/components/marketing/section";
import { getCurrentUser } from "@/server/auth/dal";

export const metadata: Metadata = {
  title: "About",
  description: "Why CareerAI exists, who it is for, and the principles it follows.",
};

const audiences = [
  {
    icon: GraduationCap,
    title: "Students",
    text: "See which skills your target roles ask for while you still have time to learn them.",
  },
  {
    icon: Rocket,
    title: "Fresh graduates",
    text: "Turn a thin first resume into a clear story and a short list of things to improve.",
  },
  {
    icon: Compass,
    title: "Job seekers and career changers",
    text: "Find roles that fit what you already know and a plan to bridge what you do not.",
  },
];

const values = [
  {
    title: "Honest scores",
    text: "Any score is labelled as an estimate. We will not claim a number guarantees an interview, because it cannot.",
  },
  {
    title: "Show how it was made",
    text: "Output is marked as AI-generated or demo. When the AI service is unavailable, you see a labelled demo, not a pretend analysis.",
  },
  {
    title: "Your data stays yours",
    text: "Each account only reaches its own data, enforced in the application and by the database itself.",
  },
  {
    title: "Free to run",
    text: "CareerAI is built on free and open-source tools and never asks for payment details.",
  },
];

const stack = ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Drizzle ORM", "Argon2id password hashing"];

export default async function AboutPage() {
  const user = await getCurrentUser();

  return (
    <>
      <Container className="pb-4 pt-14 sm:pt-20">
        <SectionHeading
          as="h1"
          title="Career guidance that tells you the truth"
          description="CareerAI helps people understand where their resume and skills stand today, and what to do next. It is an independent project, still in active development."
        />
      </Container>

      <Section>
        <SectionHeading title="Who it is for" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {audiences.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card)">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary [&_svg]:size-5">
                <Icon />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading title="What we hold ourselves to" />
        <dl className="mx-auto mt-12 grid max-w-4xl gap-x-10 gap-y-8 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title}>
              <dt className="text-lg font-semibold tracking-tight">{v.title}</dt>
              <dd className="mt-2 text-muted-foreground">{v.text}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <SectionHeading
          title="How it is built"
          description="A conventional, inspectable stack. Nothing here needs a paid service to run."
        />
        <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
          {stack.map((item) => (
            <li key={item} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-(--shadow-card)">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand signedIn={Boolean(user)} />
    </>
  );
}
