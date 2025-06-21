"use client";

import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useEffect, useRef } from "react";
import type { ValidationError } from "~/types/validation";
import {
  getToastConfigForError,
  isValidationError,
} from "~/utils/validation-helpers";

export function useValidationErrors(
  errors: ValidationError | Record<string, unknown> | undefined,
) {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>("");
  const lastErrorTimeRef = useRef<number>(0);

  const showToast = useCallback(
    (title: string, description: string) => {
      const errorKey = `${title}:${description}`;
      const now = Date.now();

      if (
        lastErrorRef.current !== errorKey ||
        now - lastErrorTimeRef.current > 3000
      ) {
        lastErrorRef.current = errorKey;
        lastErrorTimeRef.current = now;
        toast({
          title,
          description,
          variant: "destructive" as const,
          duration: 6 * 1_000,
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) {
      lastErrorRef.current = "";
      return;
    }

    if (isValidationError(errors) && errors.details && errors.errorType) {
      const toastConfig = getToastConfigForError(
        errors.errorType,
        errors.details,
      );
      showToast(toastConfig.title, toastConfig.description);
      return;
    }

    const errorEntries = Object.entries(errors);
    if (errorEntries.length > 0) {
      const firstEntry = errorEntries[0];
      if (firstEntry) {
        const [, errorMessage] = firstEntry;
        if (typeof errorMessage === "string") {
          showToast("Validation Error", errorMessage);
        }
      }
    }
  }, [errors, showToast]);
}
