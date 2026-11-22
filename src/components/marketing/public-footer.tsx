import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "./section";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <Container className="grid gap-10 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-xs">
          <Link href="/" aria-label="CareerAI home">
            <Logo className="[&_.text-primary]:text-brand dark:[&_.text-primary]:text-primary" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Resume analysis, skill gaps, interview practice and learning plans for students and job seekers.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} CareerAI</p>
          <p>Scores are estimates and do not guarantee interviews or job offers.</p>
        </Container>
      </div>
    </footer>
  );
}
