/**
 * Agent name validation utilities
 *
 * Agent names must conform to namespace segment format:
 * - 1-63 characters long
 * - Start and end with alphanumeric characters [a-z0-9]
 * - Middle can contain lowercase letters, numbers, hyphens, and underscores
 * - No uppercase, spaces, or special characters
 *
 * Regex: ^[a-z0-9]([a-z0-9-_]{0,61}[a-z0-9])?$
 */

import { z } from "zod";

/**
 * Regular expression for validating agent names
 * Matches: a-z, 0-9, hyphens, underscores
 * Must start and end with alphanumeric characters
 * Length: 1-63 characters
 */
export const AGENT_NAME_REGEX = /^[a-z0-9]([a-z0-9-_]{0,61}[a-z0-9])?$/;

/**
 * Error messages for agent name validation
 */
const errorMessages = {
  required: "Agent name is required",
  tooLong: "Agent name cannot exceed 63 characters",
  invalidStart: "Agent name cannot start with a hyphen or underscore",
  invalidEnd: "Agent name cannot end with a hyphen or underscore",
  uppercase: "Agent name cannot contain uppercase letters",
  invalidChars:
    "Agent name can only contain lowercase letters, numbers, hyphens, and underscores",
};

/**
 * Validates an agent name and returns an error message if invalid, null if valid
 *
 * @param name - The agent name to validate
 * @returns Error message string if invalid, null if valid
 *
 * @example
 * ```typescript
 * validateAgentName("my-agent") // null (valid)
 * validateAgentName("-agent") // "Agent name cannot start with a hyphen or underscore"
 * validateAgentName("") // "Agent name is required"
 * ```
 */
export const validateAgentName = (name: string): string | null => {
  if (!name) return errorMessages.required;
  if (name.length > 63) return errorMessages.tooLong;
  if (name.startsWith("-") || name.startsWith("_"))
    return errorMessages.invalidStart;
  if (name.endsWith("-") || name.endsWith("_")) return errorMessages.invalidEnd;
  if (/[A-Z]/.test(name)) return errorMessages.uppercase;
  if (!AGENT_NAME_REGEX.test(name)) return errorMessages.invalidChars;
  return null;
};

/**
 * Returns true if the agent name is valid, false otherwise
 *
 * @param name - The agent name to check
 * @returns true if valid, false if invalid
 *
 * @example
 * ```typescript
 * isValidAgentName("my-agent") // true
 * isValidAgentName("-agent") // false
 * isValidAgentName("") // false
 * ```
 */
export const isValidAgentName = (name: string): boolean =>
  validateAgentName(name) === null;

/**
 * Custom Zod field for required agent name validation
 *
 * @returns Zod schema for required agent name field
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: agentNameField(),
 *   // ... other fields
 * });
 * ```
 */
export const agentNameField = () =>
  z
    .string()
    .min(1, errorMessages.required)
    .refine(
      (name) => isValidAgentName(name),
      (name) => ({
        message: validateAgentName(name) ?? errorMessages.invalidChars,
      }),
    );

/**
 * Custom Zod field for optional agent name validation
 * Accepts undefined but rejects empty strings and invalid names
 *
 * @returns Zod schema for optional agent name field
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: optionalAgentNameField(),
 *   // ... other fields
 * });
 * ```
 */
export const optionalAgentNameField = () =>
  z
    .string()
    .optional()
    .refine(
      (name) => name === undefined || isValidAgentName(name),
      (name) => ({
        message:
          name === undefined
            ? errorMessages.invalidChars
            : (validateAgentName(name) ?? errorMessages.invalidChars),
      }),
    );

/**
 * Custom Zod field for read-only agent name (for update forms)
 * Accepts any string since the field is immutable and cannot be changed
 *
 * @returns Zod schema for read-only agent name field
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: readOnlyAgentNameField(),
 *   // ... other fields
 * });
 * ```
 */
export const readOnlyAgentNameField = () =>
  z
    .string()
    .trim()
    .optional()
    .describe("Agent name (immutable, cannot be changed)");
