# Documentation Style Guide

This document defines the JSDoc documentation standards for the Torus TypeScript monorepo.

## General Principles

1. **Avoid Redundancy**: Don't document what TypeScript already makes clear
2. **Focus on Intent**: Explain *why* and *how*, not just *what*
3. **Practical Examples**: Show real-world usage patterns
4. **Consistency**: Follow the same patterns across all packages

## JSDoc Standards

### When to Document Return Types

**Skip `@returns` when the return type is obvious from TypeScript:**

```ts
// ❌ Redundant - TypeScript already shows this returns ErrorArray
/**
 * Creates an ErrorArray from an array of errors.
 * @param errors - Array of Error objects to aggregate
 * @returns A new ErrorArray instance containing the provided errors
 */
static from(errors: Error[]): ErrorArray

// ✅ Better - focus on behavior and usage
/**
 * Creates an ErrorArray from an array of errors.
 * @param errors - Array of Error objects to aggregate
 */
static from(errors: Error[]): ErrorArray
```

**Include `@returns` when the behavior isn't obvious:**

```ts
// ✅ Good - explains the Result tuple behavior
/**
 * Handles synchronous operations with Go-style error handling.
 * @param syncOperation - A synchronous function that might throw
 * @returns A tuple with [error or undefined, data or undefined]
 */
export function trySync<T>(syncOperation: () => T): Result<T, Error>
```

### Classes

Focus on purpose, behavior, and usage patterns:

```ts
/**
 * A class that aggregates multiple errors into a single error-like object.
 * 
 * Extends Array<Error> and implements the Error interface, allowing it to be
 * used both as a collection of errors and as a single error object.
 * 
 * @example
 * ```ts
 * const errors = [new Error('Field A invalid'), new Error('Field B required')];
 * const errorArray = new ErrorArray(errors);
 * 
 * // Use as Error
 * throw errorArray; // Works like any Error
 * 
 * // Use as Array
 * errorArray.forEach(err => console.log(err.message));
 * ```
 */
export class ErrorArray extends Array<Error> implements MultiError {
```

### Types and Interfaces

Keep descriptions concise and focus on purpose:

```ts
/**
 * Combines Error and Array<Error> interfaces for dual-purpose error handling.
 */
export type MultiError = Error & Error[];

/**
 * Configuration for customizing ErrorArray behavior.
 */
interface ErrorArrayConfig {
  /** Override the default combined message */
  message?: string;
  /** Override the default combined name */  
  name?: string;
}
```

### Methods and Functions

Focus on behavior and usage. Skip redundant return type documentation:

```ts
// ✅ Good - focuses on what it does and when to use it
/**
 * Type guard to check if a value is an instance of Error.
 * @param error - The value to check
 * @example
 * ```ts
 * if (isError(result)) {
 *   console.error(result.message);
 * }
 * ```
 */
export function isError(error: unknown): error is Error

// ❌ Avoid - redundant return documentation
/**
 * Type guard to check if a value is an instance of Error.
 * @param error - The value to check
 * @returns True if the value is an Error instance, false otherwise
 */
export function isError(error: unknown): error is Error
```

For complex functions, explain non-obvious behavior:

```ts
/**
 * Ensures that the provided value is converted to an Error object.
 * 
 * If the input is already an Error, returns it unchanged. Otherwise, attempts
 * to create a new Error with a stringified version of the input.
 * 
 * @param maybeError - The value to convert to an Error
 * @example
 * ```ts
 * // Returns original error
 * ensureError(new Error('test')); // Error: test
 * 
 * // Converts object to Error  
 * ensureError({ message: 'test' }); // Error: {"message":"test"}
 * ```
 */
export function ensureError(maybeError: unknown): Error
```

## Best Practices

### Examples

- Use realistic, practical scenarios
- Keep examples concise but complete
- Show the most common usage patterns first
- Include edge cases when relevant

### Parameter Documentation

- Focus on purpose and expected format
- Skip obvious type information (TypeScript handles this)
- Mark optional parameters when behavior changes significantly
- Explain constraints and validation requirements

### When to Skip Documentation

- Simple getters/setters with obvious behavior

### Code Quality

- Ensure all code examples are syntactically correct
- Use consistent naming in examples
- Include necessary imports only when not obvious
