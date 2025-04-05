import type { Result } from "../result";
import { tryAsync, tryAsyncStr, trySync, trySyncStr } from "../try-catch";

// Define log levels
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Handles server-side async operations with logging
 * @param asyncOperation The async operation to execute
 * @param options Logging configuration options
 * @returns A tuple with [error or undefined, result or undefined]
 */
export async function tryAsyncLogging<T>(
  asyncOperation: PromiseLike<T>,
  options: LogLevel = "error",
): Promise<Result<T, string>> {
  const result = await tryAsyncStr(asyncOperation);
  const [error, _value] = result;

  if (error) {
    logServerError(error, options);
  }

  return result;
}

/**
 * Handles server-side async operations with logging, returning the raw error
 * @param asyncOperation The async operation to execute
 * @param options Logging configuration options
 * @returns A tuple with [raw error or undefined, result or undefined]
 */
export async function tryAsyncLoggingRaw<T = unknown>(
  asyncOperation: PromiseLike<T>,
  options: LogLevel = "error",
): Promise<Result<T, Error>> {
  const result = await tryAsync<T>(asyncOperation);
  const [error, _value] = result;
  if (error) {
    logServerError(error, options);
  }
  return result;
}

/**
 * Handles server-side sync operations with logging
 * @param syncOperation The sync operation to execute
 * @param options Logging configuration options
 * @returns A tuple with [error or undefined, result or undefined]
 */
export function trySyncLogging<T>(
  syncOperation: () => T,
  options: LogLevel = "error",
): Result<T, string> {
  const result = trySyncStr(syncOperation);
  const [error, _value] = result;

  if (error) {
    logServerError(error, options);
  }

  return result;
}

/**
 * Handles server-side sync operations with logging, returning the raw error
 * @param syncOperation The sync operation to execute
 * @param options Logging configuration options
 * @returns A tuple with [raw error or undefined, result or undefined]
 */
export function trySyncLoggingRaw<T = unknown>(
  syncOperation: () => T,
  options: LogLevel = "error",
): Result<T, Error> {
  const result = trySync<T>(syncOperation);
  const [error, _value] = result;

  if (error) {
    logServerError(error, options);
  }

  return result;
}

/**
 * Logs an error on the server with formatting
 * @param error The error to log
 * @param options Logging configuration options
 */
function logServerError(error: unknown, options: LogLevel = "error"): void {
  const formattedError = formatError(error, { level: options });

  // Log with the appropriate level
  switch (options) {
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
  options: {
    level?: LogLevel;
    service?: string;
    context?: Record<string, unknown>;
    stack?: boolean;
  } = { level: "error" },
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
