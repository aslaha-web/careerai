import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/routes";
import { getCurrentUser } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeRedirectPath(next);

  // Validated against the database, so a stale cookie cannot cause a redirect loop.
  if (await getCurrentUser()) redirect(safeNext);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">Log in to continue with your career plan.</p>
      <LoginForm next={safeNext === "/dashboard" ? undefined : safeNext} />
    </>
  );
}
