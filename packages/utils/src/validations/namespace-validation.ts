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
const errorMessages = {
  required: "Namespace segment is required",
  tooLong: "Namespace segment cannot exceed 63 characters",
  invalidStart: "Namespace segment must start with a lowercase letter or digit",
  invalidEnd: "Namespace segment must end with a lowercase letter or digit",
  uppercase: "Namespace segment cannot contain uppercase letters",
  invalidChars:
    "Namespace segment can only contain lowercase letters, numbers, hyphens, underscores, and plus signs",
  generic: "Namespace segment is invalid",
};

/**
 * Validates a namespace segment and returns an error message if invalid, null if valid
 *
 * @param segment - The namespace segment to validate
 * @returns Error message string if invalid, null if valid
 *
 * @example
 * ```typescript
 * validateNamespaceSegment("my-segment") // null (valid)
 * validateNamespaceSegment("my+segment") // null (valid)
 * validateNamespaceSegment("-segment") // "Namespace segment must start with a lowercase letter or digit"
 * validateNamespaceSegment("") // "Namespace segment is required"
 * ```
 */
export const validateNamespaceSegment = (segment: string): string | null => {
  if (!segment) return errorMessages.required;
  if (segment.length > 63) return errorMessages.tooLong;
  if (/[A-Z]/.test(segment)) return errorMessages.uppercase;
  if (!/^[a-z0-9]/.test(segment)) return errorMessages.invalidStart;
  if (!/[a-z0-9]$/.test(segment)) return errorMessages.invalidEnd;
  if (!/^[a-z0-9-_+]*$/.test(segment)) return errorMessages.invalidChars;
  if (!NAMESPACE_SEGMENT_REGEX.test(segment)) return errorMessages.generic;
  return null;
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
export const isValidNamespaceSegment = (segment: string): boolean =>
  validateNamespaceSegment(segment) === null;

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
    .min(1, errorMessages.required)
    .refine(
      (segment) => isValidNamespaceSegment(segment),
      (segment) => ({
        message: validateNamespaceSegment(segment) ?? errorMessages.generic,
      }),
    );
