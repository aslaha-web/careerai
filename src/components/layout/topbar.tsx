"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { getNavTitle } from "@/config/nav";
import { getInitials } from "@/lib/utils";
import type { SessionUser } from "@/server/auth/session-store";

export function Topbar({ user, onMenuClick, menuOpen }: { user: SessionUser; onMenuClick: () => void; menuOpen: boolean }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        aria-expanded={menuOpen}
        aria-controls="mobile-sidebar"
        onClick={onMenuClick}
      >
        <Menu className="size-5" />
      </Button>

      <p className="text-sm font-medium">{getNavTitle(pathname)}</p>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <div
          className="ml-1 flex size-9 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent text-xs font-semibold text-white"
          title={user.name}
          aria-label={`Signed in as ${user.name}`}
        >
          {getInitials(user.name)}
        </div>
      </div>
    </header>
  );
}
