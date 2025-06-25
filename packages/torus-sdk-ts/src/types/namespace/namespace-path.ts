/**
 * Namespace segment validation utilities
 *
 * Namespace segments must conform to the following format:
 * - 1-63 characters long
 * - Start and end with alphanumeric characters [a-z0-9]
 * - Middle can contain lowercase letters, numbers, hyphens, underscores, and plus signs
 * - No uppercase, spaces, or other special characters
 *
 * Regex: ^[a-z0-9]([a-z0-9-_+]{0,61}[a-z0-9])?$
 */

import { z } from "zod";

import type { Brand } from "@torus-network/torus-utils";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";

/**
 * Branded string type for a validated single segment of a namespace path.
 *
 * Use {@link validateNamespaceSegment} to create instances of this type.
 *
 * @example
 * ```ts
 * const [error, segment] = validateNamespaceSegment("my-segment");
 * if (!error) {
 *   // segment is now of type NamespaceSegment
 *   processSegment(segment);
 * }
 * ```
 */
export type NamespaceSegment = Brand<"NamespaceSegment", string>;

/**
 * Branded array type for a validated namespace path consisting of dot-separated
 * segments.
 *
 * Represents a complete namespace path that has been validated to ensure all
 * segments conform to the namespace format rules and the total path length is
 * within limits.
 *
 * Use {@link validateNamespacePath} to create instances of this type.
 *
 * @example
 * ```ts
 * const [error, pathSegments] = validateNamespacePath("api.v2.users");
 * if (!error) {
 *   // pathSegments is now of type NamespacePath
 *   // Contains: ["api", "v2", "users"]
 *   processNamespacePath(pathSegments);
 * }
 * ```
 */
export type NamespacePath = Brand<"NamespacePath", string[]>;

/**
 * Maximum length of a namespace segment
 */
export const NAMESPACE_SEGMENT_MAX_LENGTH = 63;

/**
 * Maximum length of a namespace path
 */
export const NAMESPACE_PATH_MAX_LENGTH = 255;

// ==== Namespace segments ====

/**
 * Regular expression for validating namespace segments
 * Matches: a-z, 0-9, hyphens, underscores, plus signs
 * Must start and end with alphanumeric characters
 * Length: 1-63 characters
 */
export const NAMESPACE_SEGMENT_REGEX = /^[a-z0-9]([a-z0-9-_+]{0,61}[a-z0-9])?$/;

/**
 * Error messages for namespace segment validation
 */
const segmentErrorMessages = {
  required: "Path segment is required",
  tooLong: `Path segment cannot exceed ${NAMESPACE_SEGMENT_MAX_LENGTH} characters`,
  invalidStart: "Path segment must start with a lowercase letter or digit",
  invalidEnd: "Path segment must end with a lowercase letter or digit",
  uppercase: "Path segment cannot contain uppercase letters",
  invalidChars:
    "Path segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
  generic: "Path segment is invalid",
};

/**
 * Validates a namespace segment
 *
 * @param segment - The namespace segment to validate
 * @returns Result with segment if valid, error message if invalid
 *
 * @example
 * ```typescript
 * validateNamespaceSegment("my-segment") // [undefined, NamespaceSegment("my-segment")]
 * validateNamespaceSegment("my+segment") // [undefined, NamespaceSegment("my+segment")]
 * validateNamespaceSegment("-segment") // ["Path segment must start with a lowercase letter or digit", undefined]
 * validateNamespaceSegment("") // ["Path segment is required", undefined]
 * ```
 */
export const validateNamespaceSegment = (
  segment: string,
): Result<NamespaceSegment, string> => {
  const e = (err: string) => makeErr(err);

  if (!segment) return e(segmentErrorMessages.required);
  if (segment.length > NAMESPACE_SEGMENT_MAX_LENGTH)
    return e(segmentErrorMessages.tooLong);
  if (/[A-Z]/.test(segment)) return e(segmentErrorMessages.uppercase);
  if (!/^[a-z0-9]/.test(segment)) return e(segmentErrorMessages.invalidStart);
  if (!/[a-z0-9]$/.test(segment)) return e(segmentErrorMessages.invalidEnd);
  if (!/^[a-z0-9-_+]*$/.test(segment))
    return e(segmentErrorMessages.invalidChars);
  if (!NAMESPACE_SEGMENT_REGEX.test(segment))
    return e(segmentErrorMessages.generic);
  return makeOk(segment as NamespaceSegment);
};

/**
 * Returns true if the namespace segment is valid, false otherwise
 *
 * @param segment - The namespace segment to check
 * @returns true if valid, false if invalid
 *
 * @example
 * ```typescript
 * isValidNamespaceSegment("my-segment") // true
 * isValidNamespaceSegment("my+segment") // true
 * isValidNamespaceSegment("-segment") // false
 * isValidNamespaceSegment("") // false
 * ```
 */
export const isValidNamespaceSegment = (segment: string): boolean => {
  const [error] = validateNamespaceSegment(segment);
  return error === undefined;
};

/**
 * Custom Zod field for required namespace segment validation
 *
 * @returns Zod schema for required namespace segment field
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   segment: namespaceSegmentField(),
 *   // ... other fields
 * });
 * ```
 */
export const namespaceSegmentField = () =>
  z
    .string()
    .min(1, segmentErrorMessages.required)
    .refine(
      (segment) => isValidNamespaceSegment(segment),
      (segment) => ({
        message:
          validateNamespaceSegment(segment)[0] ?? segmentErrorMessages.generic,
      }),
    );

// ==== Namespace paths ====

const pathErrorMessages = {
  required: "Path is required",
  tooLong: `Path cannot exceed ${NAMESPACE_PATH_MAX_LENGTH} characters`,
  emptySegment: "Path segment is empty",
  invalidSegment: (errMsg: string) => `Path is invalid: ${errMsg}`,
  generic: "Path is invalid",
};

/**
 * Validates a namespace path consisting of dot-separated segments
 *
 * @param path - The namespace path to validate (e.g., "api.v2.users")
 * @returns Result with array of segments if valid, error message if invalid
 *
 * @example
 * ```typescript
 * validateNamespacePath("api.v2.users") // [undefined, NamespacePath(["api", "v2", "users"])]
 * validateNamespacePath("my-app.config") // [undefined, NamespacePath(["my-app", "config"])]
 * validateNamespacePath("api..users") // ["Path segment is empty", undefined]
 * validateNamespacePath("") // ["Path is required", undefined]
 * validateNamespacePath("Test.api") // ["Path is invalid: Path segment cannot contain uppercase letters", undefined]
 * ```
 */
export const validateNamespacePath = (
  path: string,
): Result<NamespacePath, string> => {
  const e = (err: string) => makeErr(err);

  if (!path) return e(pathErrorMessages.required);
  if (path.length > NAMESPACE_PATH_MAX_LENGTH)
    return e(pathErrorMessages.tooLong);

  const segments = path.split(".");
  for (const segment of segments) {
    if (!segment) return e(pathErrorMessages.emptySegment);
    const [error] = validateNamespaceSegment(segment);
    if (error) {
      const msg = pathErrorMessages.invalidSegment(error);
      return e(msg);
    }
  }

  return makeOk(segments as NamespacePath);
};

/**
 * Returns true if the namespace path is valid, false otherwise
 *
 * @param path - The namespace path to check
 * @returns true if valid, false if invalid
 *
 * @example
 * ```typescript
 * isValidNamespacePath("api.v2.users") // true
 * isValidNamespacePath("my-app.config") // true
 * isValidNamespacePath("api..users") // false
 * isValidNamespacePath("") // false
 * ```
 */
export const isValidNamespacePath = (path: string): boolean => {
  const [error] = validateNamespacePath(path);
  return error === undefined;
};

/**
 * Custom Zod field for required namespace path validation
 *
 * @returns Zod schema for required namespace path field
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   path: namespacePathField(),
 *   // ... other fields
 * });
 * ```
 */
export const namespacePathField = () =>
  z.string().refine(
    (path) => isValidNamespacePath(path),
    (path) => ({
      message: validateNamespacePath(path)[0] ?? pathErrorMessages.generic,
    }),
  );
