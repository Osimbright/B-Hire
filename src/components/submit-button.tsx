"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonStyles, type ButtonVariant } from "@/components/ui";

/** Submit button that disables itself while its form's server action runs. */
export function SubmitButton({
  children,
  pendingText = "Working…",
  variant = "primary",
  className,
  confirm,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
  /** If set, asks the user to confirm before submitting. */
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonStyles(variant, "md", className)}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
