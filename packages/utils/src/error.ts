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
