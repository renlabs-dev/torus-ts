import { tryAsync, tryAsyncRawError } from "../async-operations";

// You can add more examples here
// You also can youse the mocks created here for your examples

// Mock API client for examples
export const apiClient = {
  fetchUserData: async (userId: number): Promise<Record<string, unknown>> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (userId <= 0) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    return {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
    };
  },

  createManyUserAgentData: async (
    agents: Record<string, unknown>[],
  ): Promise<{ success: boolean; count: number }> => {
    console.log(`  [DB] Creating agent data for ${agents.length} agents`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

    // Randomly succeed or fail to demonstrate error handling
    if (Math.random() > 0.3) {
      return { success: true, count: agents.length };
    } else {
      throw new Error(
        `Failed to create agent data for ${agents.length} agents`,
      );
    }
  },
};

// Example with successful user fetch
export async function exampleSuccessfulFetch(): Promise<void> {
  console.log("\n--- Example: Successful User Fetch ---");

  const [error, userData] = await tryAsync(apiClient.fetchUserData(1));

  if (error !== undefined) {
    console.error("Unexpected error:", error);
  } else {
    console.log("User data:", userData);
  }
}

// Example with failed user fetch
export async function exampleFailedFetch(): Promise<void> {
  console.log("\n--- Example: Failed User Fetch (Invalid ID) ---");

  const [error, userData] = await tryAsync(apiClient.fetchUserData(-1));

  if (error !== undefined) {
    console.error("Error:", error);
  } else {
    console.log("Unexpected success, user data:", userData);
  }
}

// Example with creating agent data
export async function exampleCreateAgents(): Promise<void> {
  console.log("\n--- Example: Creating Agent Data ---");

  const agents = [
    { id: 1, name: "Agent 1" },
    { id: 2, name: "Agent 2" },
  ];

  const [error, result] = await tryAsync(
    apiClient.createManyUserAgentData(agents),
  );

  if (error !== undefined) {
    console.error("Failed to create agents:", error);
  } else {
    console.log(`Successfully created ${result?.count} agents`);
  }
}

// Example with raw error object
export async function exampleWithRawError(): Promise<void> {
  console.log("\n--- Example: With Raw Error Object ---");

  const [error, result] = await tryAsyncRawError<
    Error,
    Record<string, unknown>
  >(apiClient.fetchUserData(-1));

  if (error !== undefined) {
    console.error("Error object:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  } else {
    console.log("Success! Result:", result);
  }
}

// Example with async function
export async function exampleWithAsyncFunction(): Promise<void> {
  console.log("\n--- Example: With Async Function ---");

  const [error, data] = await tryAsync(async () => {
    const response = await apiClient.fetchUserData(2);
    return {
      ...response,
      lastLogin: new Date().toISOString(),
    };
  });

  if (error !== undefined) {
    console.error("Error:", error);
  } else {
    console.log("Processed data:", data);
  }
}

// Run all examples
export async function runAsyncExamples(): Promise<void> {
  console.log("=== RUNNING ASYNCHRONOUS EXAMPLES ===");
  await exampleSuccessfulFetch();
  await exampleFailedFetch();
  await exampleCreateAgents();
  await exampleWithRawError();
  await exampleWithAsyncFunction();
}
