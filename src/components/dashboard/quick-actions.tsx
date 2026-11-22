import Link from "next/link";
import { mainNav } from "@/config/nav";

const quickHrefs = ["/resume-analyzer", "/skill-gap", "/interview-prep", "/learning-roadmap"];
const items = mainNav.filter((item) => quickHrefs.includes(item.href));

export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ href, title, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-(--shadow-card) transition-colors hover:border-primary/50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/12 group-hover:text-primary">
            <Icon className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{title}</span>
            <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{description}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
