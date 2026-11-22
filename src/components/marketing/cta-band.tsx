import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "./section";

export function CtaBand({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="pb-16 sm:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-banner-from to-banner-to px-6 py-12 text-center text-white shadow-(--shadow-card) sm:px-12 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[28px] border-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-10 size-64 rounded-full bg-violet-400/25 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Start with a clear picture of where you stand
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/85 text-pretty">
              Create a free account and set up your profile. New tools arrive as they are finished.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {signedIn ? (
                <Link href="/dashboard" className={buttonStyles({ variant: "inverse", size: "lg" })}>
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className={buttonStyles({ variant: "inverse", size: "lg" })}>
                    Create free account
                  </Link>
                  <Link href="/features" className={buttonStyles({ size: "lg", className: "bg-white/15 text-white hover:bg-white/25" })}>
                    See features
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
