import type { Extends } from "tsafe";
import { assert } from "tsafe";

type ErrorCtr = new (message: string, options?: ErrorOptions) => Error;

/**
 * Type guard to check if a value is an instance of Error.
 *
 * @param error - The value to check.
 * @returns True if the value is an Error instance, false otherwise.
 *
 * @example
 * if (isError(result)) {
 *   console.error(result.message);
 * }
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export interface ErrorLike {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

// ErrorLike is - in theory, at the present moment - identical with Error
// as defined by Ts typing of the ECMAScript standard. But well keep this as
// a separate type to avoid any possible issues in the future.
assert<Extends<ErrorLike, Error>>();

export function isErrorLike(v: unknown): v is ErrorLike {
  if (!v || typeof v !== "object") return false;
  if (!("name" in v) || typeof v.name !== "string") return false;
  if (!("message" in v) || typeof v.message !== "string") return false;
  if ("stack" in v && typeof v.stack !== "string") return false;
  return true;
}

/** Safe JSON that won't explode on cycles; optional length cap */
function safeStringify(value: unknown, maxLen = 1000): string {
  const seen = new WeakSet();
  const json = JSON.stringify(value, (_k, v: unknown) => {
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }
    if (typeof v === "bigint") return v.toString(); // JSON can't do bigint
    if (typeof v === "symbol") return String(v);
    if (typeof v === "function") return `[Function ${v.name || "anonymous"}]`;
    return v;
  });
  return json.length > maxLen ? json.slice(0, maxLen) + "…[truncated]" : json;
}

/** Turns a value into a string representation that can be used for error messages */
function messageFor(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "symbol") return String(value);
  if (Array.isArray(value))
    return `Aggregate(${value.length}): ` + safeStringify(value);
  if (value && typeof value === "object") return safeStringify(value);
  return String(value);
}

/**
 * Ensures that the provided value is converted to an Error object.
 *
 * If the input is already an Error, returns it unchanged. Otherwise, attempts
 * to create a new Error with a stringified version of the input.
 *
 * @param maybeError - The value to convert to an Error
 * @returns An Error object
 *
 * @example
 * ```ts
 * // Returns original error
 * ensureError(new Error('test')); // Error: test
 *
 * // Converts object to Error
 * ensureError({ message: 'test' }); // Error: {"message":"test"}
 *
 * // Handles non-stringifiable values
 * ensureError(undefined); // Error: undefined
 * ```
 */
// TODO: add unit tests for `ensureError`
export function ensureError(maybeError: unknown): Error {
  if (isError(maybeError)) {
    return maybeError;
  }

  // If it's "error-like", reconstruct a proper Error while preserving details
  if (isErrorLike(maybeError)) {
    const { name, message, stack, cause } = maybeError;

    const err = new Error(message, { cause: maybeError });
    err.name = name;

    if (typeof stack === "string") {
      // Keep provided stack if present (e.g., serialized errors)
      err.stack = stack;
    }
    if (cause !== undefined) {
      // Keep provided cause if present (e.g., serialized errors)
      err.cause = cause;
    }

    return err;
  }

  const message = messageFor(maybeError);
  return new Error(message, { cause: maybeError });
}

/**
 * Creates an error with a chained message that preserves the original error as the cause.
 *
 * This utility function helps create more descriptive error messages by prepending
 * a context message to the original error message while preserving the original
 * error as the cause. This is particularly useful when handling errors from
 * lower-level operations and adding domain-specific context.
 *
 * @param msg - The context message to prepend to the error
 * @param errCtr - Optional error constructor to use (defaults to Error)
 * @returns A function that takes an error and returns a new error with chained message
 *
 * @example
 * ```ts
 * // Basic usage
 * try {
 *   await someOperation();
 * } catch (err) {
 *   throw chainErr("Failed to perform operation")(err);
 *   // Results in: Error: Failed to perform operation: Original error message
 * }
 *
 * // With custom error constructor
 * class ValidationError extends Error {}
 *
 * try {
 *   await validateData();
 * } catch (err) {
 *   throw chainErr("Validation failed", ValidationError)(err);
 *   // Results in: ValidationError: Validation failed: Original validation error
 * }
 *
 * // In async operations with Result types
 * const [err, data] = await someAsyncOperation();
 * if (err !== undefined) {
 *   throw chainErr("Failed to fetch data")(err);
 * }
 * ```
 */
export const chainErr =
  (msg: string, errCtr: ErrorCtr = Error) =>
  (err: Error) =>
    new errCtr(`${msg}: ${err.message}`, { cause: err });

// ==== MultiError ====

/**
 * Type representing an error that combines both Error and Array<Error> interfaces.
 * Allows an error object to be treated as both a single error and a collection of errors.
 */
export type MultiError = Error & Error[];

/**
 * Configuration options for creating an ErrorArray.
 */
interface ErrorArrayConfig {
  /** Custom message to use instead of combining individual error messages */
  message?: string;
  /** Custom name to use instead of combining individual error names */
  name?: string;
}

/**
 * A class that aggregates multiple errors into a single error-like object.
 *
 * ErrorArray extends Array<Error> and implements the Error interface, allowing it to be
 * used both as a collection of errors and as a single error object. This is useful for
 * scenarios where multiple validation errors or processing errors need to be collected
 * and handled together.
 *
 * @example
 * ```ts
 * const errors = [
 *   new Error('Validation failed for field A'),
 *   new Error('Validation failed for field B')
 * ];
 * const errorArray = new ErrorArray(errors);
 *
 * // Use as an Error
 * console.log(errorArray.message); // "Validation failed for field A\nValidation failed for field B"
 * console.log(errorArray.name);    // "Error_Error"
 *
 * // Use as an Array
 * console.log(errorArray.length);  // 2
 * console.log(errorArray[0]);      // Error: Validation failed for field A
 *
 * // Iterate over errors
 * for (const error of errorArray) {
 *   console.log(error.message);
 * }
 * ```
 */
export class ErrorArray extends Array<Error> implements MultiError {
  name: string;
  message: string;
  stack?: string | undefined;
  cause?: unknown;

  /**
   * Override Symbol.species to ensure array methods return plain Arrays.
   * This prevents derived arrays from being ErrorArray instances.
   */
  static get [Symbol.species]() {
    return Array; // Every derived array will be a plain Array
  }

  /**
   * Creates an ErrorArray from an array of errors.
   *
   * @param errors - Array of Error objects to aggregate
   * @returns A new ErrorArray instance containing the provided errors
   *
   * @example
   * ```ts
   * const errors = [new Error('Error 1'), new Error('Error 2')];
   * const errorArray = ErrorArray.from(errors);
   * console.log(errorArray.length); // 2
   * ```
   */
  static from(errors: Error[]): ErrorArray {
    return new ErrorArray(errors);
  }

  /**
   * Creates a new ErrorArray instance.
   *
   * @param errors - Array of Error objects to aggregate
   * @param config - Optional configuration for custom message and name
   * @param config.message - Custom message to use instead of combining individual error messages
   * @param config.name - Custom name to use instead of combining individual error names
   *
   * @example
   * ```ts
   * // Default behavior - combines error messages and names
   * const errors = [new Error('Error 1'), new Error('Error 2')];
   * const errorArray = new ErrorArray(errors);
   *
   * // Custom message and name
   * const customErrorArray = new ErrorArray(errors, {
   *   message: 'Multiple validation errors occurred',
   *   name: 'ValidationError'
   * });
   * ```
   */
  constructor(
    public readonly errors: Error[],
    { message, name }: ErrorArrayConfig = {},
  ) {
    super(...errors);
    this.cause = errors;

    this.name = name ?? errors.map((error) => error.name).join("_");
    this.message = message ?? errors.map((error) => error.message).join("\n");

    const stackMsgs = [];
    for (const [i, error] of errors.entries()) {
      let msg = `Error ${i + 1} (${error.name})`;
      if (error.stack == null) {
        msg += " no stack";
      } else {
        msg += "\n" + error.stack;
      }
      stackMsgs.push(msg);
    }

    this.stack = stackMsgs.join("\n");
  }
}
