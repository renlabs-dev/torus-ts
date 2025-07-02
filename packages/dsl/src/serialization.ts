/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { Constraint } from "./types";

/**
 * Serializes a constraint to a JSON string, handling BigInt values
 * @param constraint The constraint to serialize
 * @returns JSON string representation of the constraint
 */
export function serializeConstraint(constraint: Constraint): string {
  return JSON.stringify(constraint, (key, value) =>
    typeof value === "bigint"
      ? { type: "bigint", value: value.toString() }
      : value,
  );
}

/**
 * Deserializes a constraint from a JSON string, handling BigInt values
 * @param json The JSON string to deserialize
 * @returns The deserialized constraint
 */
export function deserializeConstraint(json: string): Constraint {
  return JSON.parse(json, (key, value) => {
    if (value && typeof value === "object" && value.type === "bigint") {
      return BigInt(value.value);
    }
    return value;
  }) as Constraint;
}

/**
 * Helper function to convert all BigInt values in a constraint to strings for JSON serialization
 * @param constraint The constraint to process
 * @returns A constraint with all BigInt values converted to strings
 */
export function constraintToPrimitives(constraint: Constraint): any {
  return JSON.parse(
    JSON.stringify(constraint, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

/**
 * Helper function to convert all string-represented BigInt values back to actual BigInt
 * @param obj The object to process
 * @returns The object with string values converted to BigInt where appropriate
 */
export function convertStringsToBigInt(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertStringsToBigInt(item));
  }

  // Special case for NumExpr UIntLiteral
  if (obj.$ === "UIntLiteral" && typeof obj.value === "string") {
    return {
      ...obj,
      value: BigInt(obj.value),
    };
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result[key] = convertStringsToBigInt(obj[key]);
    }
  }

  return result;
}
