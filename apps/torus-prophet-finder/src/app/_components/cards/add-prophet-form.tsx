"use client";

import { HandleInputSchema } from "~/lib/handles/validate-handle";
import * as React from "react";

interface Props {
  onAdd: (rawHandle: string) => string | null | Promise<string | null>; // returns error or null (sync or async)
  suppressErrorMessage?: (msg: string) => boolean;
  searchValue: string; // Use the search field value
  disabled?: boolean;
}

export default function AddProphetForm({
  onAdd,
  searchValue,
  disabled,
}: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const missingSearch = searchValue.trim().length === 0;
  const isDisabled = disabled || missingSearch || isSubmitting;

  const handleClick = React.useCallback(async () => {
    if (!searchValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Validate and normalize the handle
      const parsed = HandleInputSchema.safeParse(searchValue.trim());
      if (!parsed.success) {
        // Let the parent handle the error display
        await onAdd(searchValue.trim());
        return;
      }

      // Call onAdd with the normalized handle
      await onAdd(parsed.data);
    } finally {
      setIsSubmitting(false);
    }
  }, [onAdd, searchValue, isSubmitting]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={
        missingSearch
          ? "Type a prophet handle into the search bar to enable Add"
          : isSubmitting
            ? "Submitting…"
            : undefined
      }
      className="inline-flex items-center justify-center rounded-none border border-white/15 bg-[#090e15] px-3.5 py-2.5 text-sm text-white/90 shadow-[0_0_18px_rgba(255,255,255,0.05)] transition-colors hover:border-white/25 hover:bg-[#0b111b] hover:shadow-[0_0_28px_rgba(255,255,255,0.09)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      + Add Prophet
    </button>
  );
}
