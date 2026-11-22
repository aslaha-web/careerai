import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-semibold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <Link href="/dashboard" className={buttonStyles({ className: "mt-6" })}>
        Go to dashboard
      </Link>
    </main>
  );
}
