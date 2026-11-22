import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { CopyButton } from "@/components/marketing/copy-button";
import { Container, SectionHeading } from "@/components/marketing/section";
import { parseContactEmail } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, bug reports or feedback about CareerAI.",
};

export default function ContactPage() {
  // Read on the server at request time. The address is shown to visitors anyway, but it is
  // configuration, not code: set CONTACT_EMAIL in the environment.
  const email = parseContactEmail(process.env.CONTACT_EMAIL);
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        as="h1"
        title="Get in touch"
        description="Questions, bug reports or feedback are all welcome. CareerAI is in active development, so your input shapes what gets built next."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card) sm:p-8">
          {email ? (
            <ContactForm to={email} />
          ) : (
            <div role="status" className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">
              {isDev ? (
                <>
                  <strong>Setup needed:</strong> no contact address is configured. Add <code className="font-mono">CONTACT_EMAIL=you@example.com</code> to
                  your <code className="font-mono">.env</code> file and restart. This message is only shown in development.
                </>
              ) : (
                <>The contact form is not available right now. Please check back soon.</>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {email ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card)">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary [&_svg]:size-5">
                <Mail />
              </span>
              <h2 className="mt-5 text-lg font-semibold tracking-tight">Prefer to email directly?</h2>
              <p className="mt-2 break-all text-sm text-muted-foreground">
                <a href={`mailto:${email}`} className="font-medium text-brand hover:underline">
                  {email}
                </a>
              </p>
              <div className="mt-4">
                <CopyButton text={email} label="Copy address" />
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card)">
            <h2 className="text-lg font-semibold tracking-tight">Helpful to include</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>For a bug: what you did, what you expected, and what happened instead.</li>
              <li>The browser and device you were using.</li>
              <li>Please do not send passwords or full resumes by email.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
