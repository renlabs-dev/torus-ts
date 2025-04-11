import { trySync, trySyncStr } from "../../try-catch";

// You can add more examples here
// You also can youse the mocks created here for your examples

// Utility functions for sync operations examples

interface UserData {
  name: string;
  age: number;
}

export const syncUtils = {
  parseJSON: (jsonString: string): unknown => {
    return JSON.parse(jsonString);
  },

  divideNumbers: (a: number, b: number): number => {
    if (b === 0) {
      throw new Error("Division by zero");
    }
    return a / b;
  },

  processUser: (userData: string): { name: string; age: number } => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed: UserData = JSON.parse(userData);

    if (!parsed.name || !parsed.age) {
      throw new Error("Invalid user data: missing required fields");
    }

    if (typeof parsed.age !== "number" || parsed.age <= 0) {
      throw new Error("Invalid user data: age must be a positive number");
    }

    return {
      name: parsed.name,
      age: parsed.age,
    };
  },
};

// Example with successful calculation
export function exampleSuccessfulCalculation(): void {
  console.log("\n--- Example: Successful Calculation ---");

  const [error, result] = trySyncStr(() => syncUtils.divideNumbers(10, 2));

  if (error !== undefined) {
    console.error("Unexpected error:", error);
  } else {
    console.log("Result:", result);
  }
}

// Example with division by zero
export function exampleDivisionByZero(): void {
  console.log("\n--- Example: Division by Zero ---");

  const [error, result] = trySyncStr(() => syncUtils.divideNumbers(10, 0));

  if (error !== undefined) {
    console.error("Error:", error);
  } else {
    console.log("Unexpected success, result:", result);
  }
}

// Example with valid JSON parsing
export function exampleValidJSON(): void {
  console.log("\n--- Example: Valid JSON Parsing ---");

  const validJSON = '{"name": "John", "age": 30}';
  const [error, userData] = trySyncStr(() => syncUtils.processUser(validJSON));

  if (error !== undefined) {
    console.error("Unexpected error:", error);
  } else {
    console.log("Processed user data:", userData);
  }
}

// Example with invalid JSON
export function exampleInvalidJSON(): void {
  console.log("\n--- Example: Invalid JSON ---");

  const invalidJSON = '{name: "John", age: 30}'; // Missing quotes around name
  const [error, userData] = trySyncStr(() =>
    syncUtils.processUser(invalidJSON),
  );

  if (error !== undefined) {
    console.error("Error:", error);
  } else {
    console.log("Unexpected success, user data:", userData);
  }
}

// Example with raw error
export function exampleWithRawError(): void {
  console.log("\n--- Example: With Raw Error ---");

  const invalidJSON = "{{}"; // Malformed JSON
  const [error, result] = trySync(() => syncUtils.parseJSON(invalidJSON));

  if (error !== undefined) {
    console.error("Error object:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  } else {
    console.log("Unexpected success, result:", result);
  }
}

// Run all examples
export function runSyncExamples(): void {
  console.log("=== RUNNING SYNCHRONOUS EXAMPLES ===");
  exampleSuccessfulCalculation();
  exampleDivisionByZero();
  exampleValidJSON();
  exampleInvalidJSON();
  exampleWithRawError();
}
