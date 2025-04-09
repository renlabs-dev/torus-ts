import { AsyncResultObj } from "../async-result";
import { ResultObj } from "../result";
import {
  tryAsync,
  tryAsyncAllExtended,
  tryAsyncStr,
  trySync,
  trySyncStr,
  unwrapAsyncResult,
} from "../try-catch";

function log(...args: unknown[]) {
  const [first, ...rest] = args;
  console.log(`[${new Date().toISOString()}] ${String(first)}`, ...rest);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Define log levels
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Handles server-side async operations with logging
 * @param asyncOperation The async operation to execute
 * @param options Logging configuration options
 * @returns An AsyncResultObj with result or string error
 */
export function tryAsyncLogging<T>(
  asyncOperation: PromiseLike<T>,
  options: LogLevel = "error",
): AsyncResultObj<T, string> {
  const resultObj = tryAsyncStr(asyncOperation);

  void resultObj.match({
    Ok: () => {
      // success case
    },
    Err: (error) => logServerError(error, options),
  });

  return resultObj;
}

/**
 * Handles server-side async operations with logging, returning the raw error
 * @param asyncOperation The async operation to execute
 * @param options Logging configuration options
 * @returns An AsyncResultObj with result or Error
 */
export function tryAsyncLoggingRaw<T = unknown>(
  asyncOperation: PromiseLike<T>,
  options: LogLevel = "error",
): AsyncResultObj<T, Error> {
  const resultObj = tryAsync<T>(asyncOperation);

  void resultObj.match({
    Ok: () => {
      // success case
    },
    Err: (error) => logServerError(error, options),
  });

  return resultObj;
}

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

/**
 * Execute multiple async operations with logging, returning a tuple format
 * @param operations Array of async operations to execute in parallel
 * @param logLevel Optional log level for errors (defaults to "error")
 * @returns A tuple with [Error | undefined, T | undefined]
 */
export async function tryAsyncAllWithLogging<T extends unknown[]>(
  operations: { [K in keyof T]: () => Promise<T[K]> },
  logLevel: LogLevel = "error",
): Promise<[Error | undefined, T | undefined]> {
  // Use the existing tryAsyncAllExtended function
  const resultObj = await tryAsyncAllExtended<T>(operations);

  // Check for errors and log them
  await resultObj.match({
    Ok: () => {
      // Success case
    },
    Err: (error) => logServerError(error, logLevel),
  });

  // Unwrap to tuple format using existing helper
  return unwrapAsyncResult(resultObj);
}

/**
 * Execute multiple async operations with logging and retries
 * @param operations Array of async operations to execute in parallel
 * @param options Configuration options for retries and logging
 * @returns A tuple with [Error | undefined, T | undefined]
 */
export async function tryAsyncAllWithRetries<T extends unknown[]>(
  operations: { [K in keyof T]: () => Promise<T[K]> },
  options: {
    retries?: number;
    delay?: number;
    logLevel?: LogLevel;
  } = {},
): Promise<AsyncResultObj<T, Error>> {
  const retries = options.retries ?? 3;
  const delay = options.delay ?? 1000;
  const logLevel = options.logLevel ?? "error";

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    if (lastError) {
      log(`Retry ${attempt + 1}/${retries} after error: ${lastError.message}`);
      await sleep(delay);
    }

    // Use tryAsyncAllExtended which returns AsyncResultObj
    const resultObj = await tryAsyncAllExtended<T>(operations);

    // Check if we have an error
    const hasError = await resultObj.match({
      Ok: () => false,
      Err: (error) => {
        lastError = error;
        logServerError(error, logLevel);
        return true;
      },
    });

    if (!hasError) {
      // No error, return the result
      // return unwrapAsyncResult(resultObj);
      return resultObj;
    }
  }

  // All retries failed
  return AsyncResultObj.Err(lastError) as unknown as AsyncResultObj<T, Error>;
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
