"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed"); // e.g. clipboard blocked: the address is visible, so the user can select it
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {state === "copied" ? <Check /> : <Copy />}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select and copy manually" : label}</span>
    </Button>
  );
}
