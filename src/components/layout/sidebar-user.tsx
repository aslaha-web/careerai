"use client";

import { LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { logoutAction } from "@/server/auth/actions";
import type { SessionUser } from "@/server/auth/session-store";

/** Account block at the bottom of the sidebar: who is signed in, plus Log out. */
export function SidebarUser({ user }: { user: Pick<SessionUser, "name" | "email"> }) {
  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <div className="flex items-center gap-3 px-3 pb-2">
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent text-xs font-semibold text-white"
        >
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[18px] shrink-0" />
          Log out
        </button>
      </form>
    </div>
  );
}
