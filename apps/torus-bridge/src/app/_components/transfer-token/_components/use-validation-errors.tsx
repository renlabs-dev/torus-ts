"use client";

import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useEffect, useRef } from "react";

interface ValidationError {
  form?: string;
  amount?: string;
  details?: string;
  errorType?:
    | "insufficient_funds"
    | "gas_estimation"
    | "base_eth_insufficient"
    | "token_error"
    | "account_error"
    | "validation_error";
}

export function useValidationErrors(
  errors: ValidationError | Record<string, unknown> | undefined,
) {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>("");

  const showToast = useCallback(
    (title: string, description: string) => {
      const errorKey = `${title}:${description}`;
      if (lastErrorRef.current !== errorKey) {
        lastErrorRef.current = errorKey;
        toast({
          title,
          description,
          variant: "destructive" as const,
          duration: 8 * 1_000,
        });
      }
    },
    [toast],
  );

  useEffect(() => {
    console.log("useValidationErrors received:", errors);

    if (!errors || Object.keys(errors).length === 0) {
      lastErrorRef.current = "";
      return;
    }

    // Handle custom validation errors (from validateForm)
    if (
      typeof errors === "object" &&
      "details" in errors &&
      "errorType" in errors
    ) {
      const validationError = errors as ValidationError;
      if (validationError.details && validationError.errorType) {
        console.log("Showing toast for validation error:", validationError);
        const toastConfig = getToastConfigForError(
          validationError.errorType,
          validationError.details,
        );

        showToast(toastConfig.title, toastConfig.description);
      }
      return;
    }

    // Handle Formik errors (simple string errors)
    if (typeof errors === "object") {
      const formikErrors = errors as Record<string, unknown>;
      const errorEntries = Object.entries(formikErrors);

      if (errorEntries.length > 0) {
        const firstEntry = errorEntries[0];
        if (firstEntry) {
          const [field, errorMessage] = firstEntry;
          console.log("Showing toast for Formik error:", {
            field,
            errorMessage,
          });

          if (typeof errorMessage === "string") {
            showToast("Validation Error", errorMessage);
          }
        }
      }
    }
  }, [errors, showToast]);
}

function getToastConfigForError(
  errorType: ValidationError["errorType"],
  details: string,
) {
  switch (errorType) {
    case "insufficient_funds":
      return {
        title: "Insufficient Balance",
        description: details,
        variant: "destructive" as const,
      };

    case "gas_estimation":
      return {
        title: "Gas Estimation Failed",
        description: details,
        variant: "destructive" as const,
      };

    case "base_eth_insufficient":
      return {
        title: "Insufficient ETH on Base",
        description: details,
        variant: "destructive" as const,
      };

    case "token_error":
      return {
        title: "Token Configuration Error",
        description: details,
        variant: "destructive" as const,
      };

    case "account_error":
      return {
        title: "Account Connection Error",
        description: details,
        variant: "destructive" as const,
      };

    case "validation_error":
      return {
        title: "Validation Error",
        description: details,
        variant: "destructive" as const,
      };

    default:
      return {
        title: "Transfer Error",
        description: details,
        variant: "destructive" as const,
      };
  }
}
