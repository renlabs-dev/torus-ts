import type { Constraint } from "./types";
import { ZodError } from "zod";
import { ConstraintSchema } from "./schema";

/**
 * Validation error thrown when constraint validation fails
 */
export class ConstraintValidationError extends Error {
  path: string;

  constructor(path: string, message: string) {
    super(message);
    this.name = "ConstraintValidationError";
    this.path = path;
  }
}

/**
 * Validates that JSON data conforms to the Constraint structure and converts it to a proper Constraint
 * @param data Any JSON input to validate as a constraint
 * @returns The validated Constraint with proper types
 * @throws ConstraintValidationError if validation fails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateConstraint(data: any): Constraint {
  try {
    // Use Zod schema for validation
    return ConstraintSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert ZodError to ConstraintValidationError
      const firstError = error.errors[0];
      if (firstError) {
        const path = firstError.path.join(".");
        throw new ConstraintValidationError(path, firstError.message);
      } else {
        throw new ConstraintValidationError("", "Validation failed");
      }
    }
    // Re-throw unknown errors
    throw error;
  }
}

/**
 * JSON parse error thrown when JSON parsing fails
 */
export class JsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JsonParseError";
  }
}

/**
 * Parses a JSON string into a Constraint object, with validation
 * @param jsonString The JSON string to parse
 * @returns The validated Constraint with proper types
 * @throws JsonParseError if JSON parsing fails
 * @throws ConstraintValidationError if constraint validation fails
 */
export function parseConstraintJson(jsonString: string): Constraint {
  try {
    // TODO: use a zod object here
    // First try to parse the JSON
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(jsonString);

    // Then validate it as a constraint
    return validateConstraint(data);
  } catch (error) {
    // If it's already a ConstraintValidationError, re-throw it
    if (error instanceof ConstraintValidationError) {
      throw error;
    }

    // If it's a JSON parsing error, wrap it in our custom error
    if (error instanceof SyntaxError) {
      throw new JsonParseError(`Invalid JSON format: ${error.message}`);
    }

    // Re-throw any other errors
    throw error;
  }
}

/**
 * Safely parses a JSON string into a Constraint object
 * @param jsonString The JSON string to parse
 * @returns A result object with success flag and either parsed constraint or error
 */
export function safeParseConstraintJson(
  jsonString: string,
):
  | { success: true; data: Constraint }
  | { success: false; error: JsonParseError | ConstraintValidationError } {
  try {
    const data = parseConstraintJson(jsonString);
    return { success: true, data };
  } catch (error) {
    if (
      error instanceof JsonParseError ||
      error instanceof ConstraintValidationError
    ) {
      return { success: false, error };
    }
    // Convert any unexpected errors to JsonParseError
    return {
      success: false,
      error: new JsonParseError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      ),
    };
  }
}
