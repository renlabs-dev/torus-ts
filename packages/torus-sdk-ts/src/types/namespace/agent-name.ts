/**
 * Agent name validation utilities
 *
 * Agent names must conform to namespace segment format (without the `+` character):
 * - 1-63 characters long
 * - Start and end with alphanumeric characters [a-z0-9]
 * - Middle can contain lowercase letters, numbers, hyphens, and underscores
 * - No uppercase, spaces, or special characters
 *
 * Regex: ^[a-z0-9]([a-z0-9-_]{0,61}[a-z0-9])?$
 */

import { z } from "zod";

import type { Brand } from "@torus-network/torus-utils";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";

/**
 * Branded string type for a validated agent name.
 *
 * Use {@link validateAgentName} to create instances of this type.
 *
 * @example
 * ```ts
 * const [error, agentName] = validateAgentName("my-agent");
 * if (!error) {
 *   // agentName is now of type AgentName
 *   processAgentName(agentName);
 * }
 * ```
 */
export type AgentName = Brand<"AgentName", string>;

/**
 * Regular expression for validating agent names
 * Matches: a-z, 0-9, hyphens, underscores
 * Must start and end with alphanumeric characters
 * Length: 1-30 characters
 */
export const AGENT_NAME_REGEX = /^[a-z0-9]([a-z0-9-_]{0,28}[a-z0-9])?$/;

/**
 * Error messages for agent name validation
 */
const errorMessages = {
  required: "Agent name is required",
  tooLong: "Agent name cannot exceed 30 characters",
  invalidStart: "Agent name must start with a lowercase letter or digit",
  invalidEnd: "Agent name must end with a lowercase letter or digit",
  uppercase: "Agent name cannot contain uppercase letters",
  invalidChars:
    "Agent name can only contain lowercase letters, numbers, hyphens, and underscores",
  generic: "Agent name is invalid",
};

/**
 * Validates an agent name
 *
 * @param name - The agent name to validate
 * @returns Result with name if valid, error message if invalid
 *
 * @example
 * ```typescript
 * validateAgentName("my-agent") // [undefined, AgentName("my-agent")]
 * validateAgentName("-agent") // ["Agent name must start with a lowercase letter or digit", undefined]
 * validateAgentName("") // ["Agent name is required", undefined]
 * ```
 */
export const validateAgentName = (name: string): Result<AgentName, string> => {
  const e = (err: string) => makeErr(err);

  if (!name) return e(errorMessages.required);
  if (name.length > 30) return e(errorMessages.tooLong);
  if (/[A-Z]/.test(name)) return e(errorMessages.uppercase);
  if (!/^[a-z0-9]/.test(name)) return e(errorMessages.invalidStart);
  if (!/[a-z0-9]$/.test(name)) return e(errorMessages.invalidEnd);
  if (!/^[a-z0-9-_]*$/.test(name)) return e(errorMessages.invalidChars);
  if (!AGENT_NAME_REGEX.test(name)) return e(errorMessages.generic);
  return makeOk(name as AgentName);
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
export const isValidAgentName = (name: string): boolean => {
  const [error] = validateAgentName(name);
  return error === undefined;
};

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
        message: validateAgentName(name)[0] ?? errorMessages.generic,
      }),
    );
