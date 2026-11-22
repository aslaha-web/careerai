"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { SessionUser } from "@/server/auth/session-store";

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating.
  React.useEffect(() => setOpen(false), [pathname]);

  // Escape closes the drawer; page scroll is locked while it is open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <Sidebar user={user} />
      </aside>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity motion-reduce:transition-none ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <aside
          id="mobile-sidebar"
          aria-label="Navigation"
          aria-hidden={!open}
          inert={!open}
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-sidebar-border shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar user={user} onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-64">
        <Topbar user={user} menuOpen={open} onMenuClick={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
