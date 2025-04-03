import type { ReactNode } from "react";
import { tryAsyncRaw, tryAsyncStr, trySync, trySyncStr } from "../try-catch";

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
    errorMessage = error.message;
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
 * @returns A tuple with [error or undefined, result or undefined]
 */
async function tryAsyncToast<T>(
  asyncOperation: Promise<T> | (() => Promise<T>),
  options: ClientErrorOptions = {},
): Promise<readonly [string | undefined, T | undefined]> {
  const result = await tryAsyncStr(asyncOperation);
  const [error, _value] = result;

  if (error) {
    showErrorToast(error, options);
  }

  return result;
}

/**
 * Handles client-side async operations with toast notifications, returning the raw error
 * @param asyncOperation The async operation to execute
 * @param options Toast configuration options
 * @returns A tuple with [raw error or undefined, result or undefined]
 */
async function tryAsyncToastRaw<E = unknown, T = unknown>(
  asyncOperation: Promise<T> | (() => Promise<T>),
  options: ClientErrorOptions = {},
): Promise<readonly [E | undefined, T | undefined]> {
  const result = await tryAsyncRaw<E, T>(asyncOperation);
  const [error, _value] = result;

  if (error) {
    showErrorToast(error instanceof Error ? error : String(error), options);
  }

  return result;
}

/**
 * Handles client-side sync operations with toast notifications
 * @param syncOperation The sync operation to execute
 * @param options Toast configuration options
 * @returns A tuple with [error or undefined, result or undefined]
 */
function trySyncToast<T>(
  syncOperation: () => T,
  options: ClientErrorOptions = {},
): readonly [string | undefined, T | undefined] {
  const result = trySyncStr(syncOperation);
  const [error, _value] = result;

  if (error) {
    showErrorToast(error, options);
  }

  return result;
}

/**
 * Handles client-side sync operations with toast notifications, returning the raw error
 * @param syncOperation The sync operation to execute
 * @param options Toast configuration options
 * @returns A tuple with [raw error or undefined, result or undefined]
 */
function trySyncToastRaw<E = unknown, T = unknown>(
  syncOperation: () => T,
  options: ClientErrorOptions = {},
): readonly [E | undefined, T | undefined] {
  const result = trySync<E, T>(syncOperation);
  const [error, _value] = result;

  if (error) {
    showErrorToast(error instanceof Error ? error : String(error), options);
  }

  return result;
}

// All exportable functions
export {
  tryAsyncToast,
  tryAsyncToastRaw,
  trySyncToast,
  trySyncToastRaw,
  showErrorToast,
};

// All exportable types
export type { ClientErrorOptions, ToastFunction, ToastOptions };
