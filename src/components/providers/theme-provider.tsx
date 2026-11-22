"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * next-themes injects a tiny inline script that sets the `dark` class before
 * first paint, which is what prevents a flash of the wrong theme.
 * The choice is saved in localStorage ("careerai-theme").
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="careerai-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
