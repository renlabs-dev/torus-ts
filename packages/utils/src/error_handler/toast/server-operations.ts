// error_handler/toast/server-operations.ts
import { tryAsync } from "../gogotry/async-operations";
import { trySync } from "../gogotry/sync-operations";

// Define log levels
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

// Options for server-side error handling
export interface ServerErrorOptions {
  level?: LogLevel;
  context?: Record<string, unknown>;
  service?: string;
  stack?: boolean;
}

// Default server options
const defaultOptions: ServerErrorOptions = {
  level: "error",
  service: "api",
  stack: true,
};

/**
 * Handles server-side async operations with logging
 * @param asyncOperation The async operation to execute
 * @param options Logging configuration options
 * @returns A tuple with [error or undefined, result or undefined]
 */
export async function tryAsyncLogging<T>(
  asyncOperation: Promise<T> | (() => Promise<T>),
  options: ServerErrorOptions = {},
): Promise<readonly [string | undefined, T | undefined]> {
  const [error, result] = await tryAsync(asyncOperation);

  if (error) {
    logServerError(error, options);
  }

  return Object.freeze([error, result]);
}

/**
 * Handles server-side sync operations with logging
 * @param syncOperation The sync operation to execute
 * @param options Logging configuration options
 * @returns A tuple with [error or undefined, result or undefined]
 */
export function trySyncLogging<T>(
  syncOperation: () => T,
  options: ServerErrorOptions = {},
): readonly [string | undefined, T | undefined] {
  const [error, result] = trySync(syncOperation);

  if (error) {
    logServerError(error, options);
  }

  return Object.freeze([error, result]);
}

/**
 * Logs an error on the server with formatting
 * @param error The error to log
 * @param options Logging configuration options
 */
export function logServerError(
  error: unknown,
  options: ServerErrorOptions = {},
): void {
  const opts = { ...defaultOptions, ...options };

  const formattedError = formatError(error, opts);

  // Log with the appropriate level
  switch (opts.level) {
    case "debug":
      console.debug(JSON.stringify(formattedError));
      break;
    case "info":
      console.info(JSON.stringify(formattedError));
      break;
    case "warn":
      console.warn(JSON.stringify(formattedError));
      break;
    case "fatal":
      console.error("FATAL:", JSON.stringify(formattedError));
      break;
    case "error":
    default:
      console.error(JSON.stringify(formattedError));
      break;
  }
}

/**
 * Formats an error into a standardized structure
 * @param error The error to format
 * @param options Formatting options
 */
export function formatError(
  error: unknown,
  options: ServerErrorOptions,
): Record<string, unknown> {
  let formattedError: Record<string, unknown> = {
    message: "Unknown error",
    timestamp: new Date().toISOString(),
    service: options.service,
  };

  if (options.context) {
    formattedError.context = options.context;
  }

  if (error instanceof Error) {
    formattedError.message = error.message;
    formattedError.name = error.name;

    if (options.stack && error.stack) {
      formattedError.stack = error.stack;
    }
  } else if (typeof error === "string") {
    formattedError.message = error;
  } else if (error !== null && typeof error === "object") {
    formattedError = {
      ...formattedError,
      ...error,
    };
  }

  return formattedError;
}
