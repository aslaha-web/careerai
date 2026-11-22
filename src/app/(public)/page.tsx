import type { Metadata } from "next";
import Link from "next/link";
import { Gauge, Lock, ShieldCheck } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { FeatureCard } from "@/components/marketing/feature-card";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { Container, Section, SectionHeading } from "@/components/marketing/section";
import { Tag } from "@/components/marketing/tag";
import { buttonStyles } from "@/components/ui/button";
import { features } from "@/config/features";
import { getCurrentUser } from "@/server/auth/dal";

export const metadata: Metadata = {
  title: { absolute: "CareerAI | AI-powered career assistant" },
  description:
    "Analyze your resume, find skill gaps, practise interviews and follow a weekly learning roadmap. Built for students, fresh graduates and job seekers.",
};

const steps = [
  {
    title: "Add your resume and goal",
    text: "Upload a PDF or DOCX resume and choose the role you are aiming for.",
  },
  {
    title: "See what is missing",
    text: "Get a structured review, the skills you are short of, and role suggestions with reasons.",
  },
  {
    title: "Follow a plan",
    text: "Practise interview questions and work through a week-by-week roadmap, ticking tasks as you go.",
  },
];

const principles = [
  {
    icon: Gauge,
    title: "Estimates, not promises",
    text: "A resume score is our estimate. It is not a real ATS result and it never guarantees an interview.",
  },
  {
    icon: ShieldCheck,
    title: "AI is always labelled",
    text: "Results are marked as AI-generated or demo content. Role suggestions are never passed off as live job listings.",
  },
  {
    icon: Lock,
    title: "Private by default",
    text: "Every account can only see its own data, and passwords are stored as one-way Argon2id hashes.",
  },
];

const faqs: FaqItem[] = [
  {
    q: "Is CareerAI free?",
    a: "Yes. Creating an account does not ask for payment details, and CareerAI is built on free and open-source tools.",
  },
  {
    q: "Does a high resume score guarantee an interview?",
    a: "No. Scores are estimates and not real ATS results. Employers use many different systems and criteria. Use the score to find things to improve, not as a promise.",
  },
  {
    q: "Are the job suggestions real vacancies?",
    a: "No. Role recommendations are AI-generated career suggestions. CareerAI does not list or verify live job openings, and says so wherever suggestions appear.",
  },
  {
    q: "Which resume files will the analyzer accept?",
    a: "PDF and DOCX. The analyzer is still in development, so it is marked as coming soon.",
  },
  {
    q: "Can other people see my data?",
    a: "No. Each account can only access its own data.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Container className="grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-28">
          <div>
            <Tag tone="primary" className="px-3 py-1 text-sm">
              Early access
            </Tag>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Know where your resume stands, and{" "}
              <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">what to learn next</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
              CareerAI reviews your resume, finds the skills you are missing for a target role, and turns the gap into a week-by-week plan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link href="/dashboard" className={buttonStyles({ size: "lg", className: "bg-cta!" })}>
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className={buttonStyles({ size: "lg", className: "bg-cta!" })}>
                    Create free account
                  </Link>
                  <Link href="/features" className={buttonStyles({ variant: "outline", size: "lg" })}>
                    Explore features
                  </Link>
                </>
              )}
            </div>
            <p className="mt-5 max-w-md text-sm text-muted-foreground">
              Accounts are open now. The AI tools are being released one at a time and are marked <span className="font-medium text-foreground">Coming soon</span> until they are ready.
            </p>
          </div>
          <HeroVisual />
        </Container>
      </section>

      {/* Features */}
      <Section tone="muted" id="features">
        <SectionHeading
          title="Everything between your resume and your next role"
          description="Six connected tools that share your profile, so each step builds on the last."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHeading title="How it works" description="Three steps from where you are to a plan you can follow." />
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card)">
              <span className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent text-sm font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Principles */}
      <Section tone="muted">
        <SectionHeading
          title="Built to be honest with you"
          description="Career tools are full of big promises. These are the rules CareerAI follows instead."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card)">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent [&_svg]:size-5">
                <Icon />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <SectionHeading title="Common questions" />
        <div className="mt-12">
          <Faq items={faqs} />
        </div>
      </Section>

      <CtaBand signedIn={Boolean(user)} />
    </>
  );
}
