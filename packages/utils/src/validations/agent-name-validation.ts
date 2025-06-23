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

export const AGENT_NAME_REGEX = /^[a-z0-9]([a-z0-9-_]{0,61}[a-z0-9])?$/;

/**
 * Validates an agent name and returns an error message if invalid, null if valid
 */
export const validateAgentName = (name: string): string | null => {
  if (!name) {
    return "Agent name is required";
  }

  if (name.length > 63) {
    return "Agent name cannot exceed 63 characters";
  }

  if (!AGENT_NAME_REGEX.test(name)) {
    if (name.startsWith("-") || name.startsWith("_")) {
      return "Agent name cannot start with a hyphen or underscore";
    }
    if (name.endsWith("-") || name.endsWith("_")) {
      return "Agent name cannot end with a hyphen or underscore";
    }
    if (/[A-Z]/.test(name)) {
      return "Agent name cannot contain uppercase letters";
    }
    if (/[^a-z0-9-_]/.test(name)) {
      return "Agent name can only contain lowercase letters, numbers, hyphens, and underscores";
    }
    return "Agent name must be 1-63 characters, start and end with alphanumeric characters";
  }

  return null;
};

/**
 * Returns true if the agent name is valid, false otherwise
 */
export const isValidAgentName = (name: string): boolean => {
  return validateAgentName(name) === null;
};

/**
 * Custom Zod field for agent name validation
 *
 * Usage:
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
    .min(1, "Agent name is required")
    .refine(
      (name) => validateAgentName(name) === null,
      (name) => ({ message: validateAgentName(name) ?? "Invalid agent name" }),
    );

/**
 * Custom Zod field for optional agent name validation
 *
 * Usage:
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
      (name) =>
        name === undefined || (name !== "" && validateAgentName(name) === null),
      (name) => {
        if (name === undefined) return { message: "Invalid agent name" };
        if (name === "") return { message: "Agent name cannot be empty" };
        const error = validateAgentName(name);
        return { message: error || "Invalid agent name" };
      },
    );

/**
 * Custom Zod field for read-only agent name (for update forms)
 *
 * Usage:
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
