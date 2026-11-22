import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth/dal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Validates the session against the database; redirects to /login if it is missing or expired.
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
