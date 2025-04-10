import { ResultObj } from "../result";
import { trySync, trySyncStr } from "../try-catch";

// Define log levels
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Handles server-side sync operations with logging
 * @param syncOperation The sync operation to execute
 * @param options Logging configuration options
 * @returns A ResultObj with result or string error
 */
export function trySyncLogging<T>(
  syncOperation: () => T,
  options: LogLevel = "error",
): ResultObj<T, string> {
  const result = trySyncStr(syncOperation);
  const [error, _value] = result;

  if (error) {
    logServerError(error, options);
  }

  return ResultObj.from(result);
}

/**
 * Handles server-side sync operations with logging, returning the raw error
 * @param syncOperation The sync operation to execute
 * @param options Logging configuration options
 * @returns An AsyncResultObj with result or Error
 */
export function trySyncLoggingRaw<T = unknown>(
  syncOperation: () => T,
  options: LogLevel = "error",
): ResultObj<T, Error> {
  const result = trySync<T>(syncOperation);
  const [error, _value] = result;

  if (error) {
    logServerError(error, options);
  }

  // Convert Result to AsyncResultObj
  return ResultObj.from(result);
}

// Helper function for logging errors
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

// Format error for logging
export function formatError(
  error: unknown,
  options: {
    level?: LogLevel;
    service?: string;
    context?: Record<string, unknown>;
    stack?: boolean;
  } = { level: "error" },
): Record<string, unknown> {
  // Implementation remains the same
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
