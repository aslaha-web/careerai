"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button, buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Container } from "./section";

/** The blue "AI" in the logo is 4.49:1 on white (needs 4.5). Use the AA text colour in light mode only. */
const logoClass = "[&_.text-primary]:text-brand dark:[&_.text-primary]:text-primary";

const links = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeaderBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass = (href: string) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      pathname === href ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  const authButtons = signedIn ? (
    <Link href="/dashboard" className={buttonStyles({ className: "bg-cta!" })}>
      Dashboard
    </Link>
  ) : (
    <>
      <Link href="/login" className={buttonStyles({ variant: "ghost" })}>
        Log in
      </Link>
      <Link href="/register" className={buttonStyles({ className: "bg-cta!" })}>
        Get started
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" aria-label="CareerAI home" className="shrink-0">
          <Logo className={logoClass} />
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <div className="hidden items-center gap-1.5 md:flex">{authButtons}</div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </Container>

      {open ? (
        <div id="public-mobile-menu" className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={cn(linkClass(l.href), "py-3 text-base")}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 [&>a]:h-11 [&>a]:w-full">{authButtons}</div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
