"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

/** Disables itself and shows a spinner while the parent form's action is running. */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ButtonProps & { pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin motion-reduce:animate-none" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
