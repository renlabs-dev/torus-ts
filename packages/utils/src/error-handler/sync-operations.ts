import { goTryRawSync, goTrySync } from "go-go-try";

/**
 * trySync - handles synchronous operations with Go-style error handling
 * Returns a tuple with the error message (or undefined) and the data (or undefined)
 *
 * @param syncOperation A synchronous function that might throw
 * @returns A tuple with [error message or undefined, data or undefined]
 */
function trySync<T>(
  syncOperation: () => T,
): readonly [string | undefined, T | undefined] {
  return goTrySync(syncOperation);
}

/**
 * trySyncRawError - Same as trySync but returns the raw error object
 *
 * @param syncOperation A synchronous function that might throw
 * @returns A tuple with [error object or undefined, data or undefined]
 */
function trySyncRawError<E = unknown, T = unknown>(
  syncOperation: () => T,
): readonly [E | undefined, T | undefined] {
  // Use goTryRaw to get the raw error object
  const [error, result] = goTryRawSync<E, T>(syncOperation);

  // Clean up the stack trace if there is an error
  if (error instanceof Error && error.stack) {
    // Filter out lines related to error handling implementation
    const filteredStack = error.stack
      .split("\n")
      .filter(
        (line) =>
          !line.includes("trySyncRawError") &&
          !line.includes("trySyncLoggingRaw") &&
          !line.includes("goTryRaw") &&
          !line.includes("goTry"),
      )
      .join("\n");

    error.stack = filteredStack;
  }

  return Object.freeze([error, result]);
}

// All
export { trySync, trySyncRawError };
