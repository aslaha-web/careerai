import * as React from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "./input";

interface FieldProps extends InputProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  /** Replace the default <Input> (e.g. with PasswordInput). */
  control?: React.ReactElement<InputProps>;
}

/** Label + input + hint + error, wired together for screen readers. */
export function Field({ label, name, error, hint, control, className, ...inputProps }: FieldProps) {
  const id = React.useId();
  const inputId = `${id}-${name}`;
  // The hint is hidden while an error is showing, so only reference what is actually rendered.
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const shared = { id: inputId, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      {control ? React.cloneElement(control, { ...shared, ...inputProps }) : <Input {...shared} {...inputProps} />}
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
