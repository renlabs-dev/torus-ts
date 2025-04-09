import type { ReactNode } from "react";
import type { AsyncResultObj } from "../async-result";
import { ResultObj } from "../result";
import { tryAsync, tryAsyncStr, trySync, trySyncStr } from "../try-catch";

// Toast Options to construct the toast function
interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
}

// Define the toast function type
type ToastFunction = (options: ToastOptions) => {
  id: string;
  dismiss: () => void;
  update: (props: ToastOptions) => void;
};

// Client error options that extend toast options
interface ClientErrorOptions extends ToastOptions {
  toastFn?: ToastFunction;
  withErrorDetails?: boolean;
}

/**
 * Shows a toast notification for an error
 * @param error The error message or object
 * @param options Toast configuration options
 */
function showErrorToast(
  error: string | Error,
  options: ClientErrorOptions = {},
): void {
  // Get the error message
  let errorMessage: string;

  if (typeof error === "string") {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message || "An unknown error occurred.";
  } else if (typeof error === "object" && Object.keys(error).length === 0) {
    errorMessage = "An unknown error occurred.";
  } else {
    errorMessage = String(error);
  }

  // Get the toast function
  const toastFn = options.toastFn ?? console.error;

  // Show the toast
  toastFn({
    title: options.title ?? "An error occurred",
    description: options.withErrorDetails ? errorMessage : options.description,
    variant: options.variant ?? "destructive",
    ...options,
  });
}

/**
 * Handles client-side async operations with toast notifications
 * @param asyncOperation The async operation to execute
 * @param options Toast configuration options
 * @returns An AsyncResultObj with result or string error
 */
export function tryAsyncToast<T>(
  asyncOperation: PromiseLike<T>,
  options: ClientErrorOptions = {},
): AsyncResultObj<T, string> {
  const resultObj = tryAsyncStr(asyncOperation);

  // Use match to show toast for errors
  void resultObj.match({
    Ok: () => {
      // Success case
    },
    Err: (error) => showErrorToast(error, options),
  });

  return resultObj;
}

/**
 * Handles client-side async operations with toast notifications, returning the raw error
 * @param asyncOperation The async operation to execute
 * @returns An AsyncResultObj with result or Error
 */
export function tryAsyncToastRaw<T = unknown>(
  asyncOperation: PromiseLike<T>,
  options: ClientErrorOptions = {},
): AsyncResultObj<T, Error> {
  const resultObj = tryAsync<T>(asyncOperation);

  // Use match to show toast for errors
  void resultObj.match({
    Ok: () => {
      //success case
    },
    Err: (error) => {
      console.error("Raw error in tryAsyncToast:", error);
      console.error("Error details:", {
        message: error.message,
        cause: error.cause,
        name: error.name,
      });
      showErrorToast(error, options);
    },
  });

  return resultObj;
}

/**
 * Handles client-side sync operations with toast notifications
 * @param syncOperation The sync operation to execute
 * @param options Toast configuration options
 * @returns A ResultObj with result or string error
 */
export function trySyncToast<T>(
  syncOperation: () => T,
  options: ClientErrorOptions = {},
): ResultObj<T, string> {
  const result = trySyncStr(syncOperation);
  const [error, _value] = result;

  if (error) {
    showErrorToast(error, options);
  }

  return ResultObj.from(result);
}

/**
 * Handles client-side sync operations with toast notifications, returning the raw error
 * @param syncOperation The sync operation to execute
 * @param options Toast configuration options
 * @returns A ResultObj with result or Error
 */
export function trySyncToastRaw<T = unknown>(
  syncOperation: () => T,
  options: ClientErrorOptions = {},
): ResultObj<T, Error> {
  const result = trySync<T>(syncOperation);
  const [error, _value] = result;

  if (error) {
    showErrorToast(error instanceof Error ? error : String(error), options);
  }

  return ResultObj.from(result);
}
