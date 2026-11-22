import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";

const exampleSkills = ["React", "TypeScript", "REST APIs"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel: desktop only. Same blue-to-violet language as the dashboard banner. */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-banner-from via-banner-to to-accent p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full border-[36px] border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-violet-300/20 blur-3xl" />

        <Link href="/" aria-label="CareerAI home" className="relative w-fit">
          <Logo variant="light" />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">See your resume the way a recruiter&rsquo;s software does.</h2>
          <p className="mt-4 text-lg text-white/85">
            Get a clear score, the skills you are missing, and a weekly plan to close the gap.
          </p>

          <div className="mt-10 w-fit rounded-2xl bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-center gap-5">
              <ScoreRing value={78} size={96} strokeWidth={10} label="Estimate" />
              <div>
                <Badge tone="neutral">Illustration, not real data</Badge>
                <p className="mt-2 text-sm font-medium">Example resume analysis</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {exampleSkills.map((skill) => (
                    <Badge key={skill} tone="accent">
                      {skill}
                    </Badge>
                  ))}
                  <Badge tone="warning">Missing: Docker</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-white/70">Scores are estimates and do not guarantee interviews.</p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="CareerAI home" className="lg:invisible">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
