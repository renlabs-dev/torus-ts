import { z } from "zod";
import type { SS58Address } from "@torus-network/sdk";
import { Agent } from "../agent/index.js";

// Create a simple test server with a hello endpoint
const agent = new Agent({
  agentKey: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" as SS58Address, // Mock agent key for testing
  address: "test-agent-address",
  port: 3001,
  docs: {
    info: {
      title: "Test Agent API",
      version: "1.0.0",
    },
  },
});

// Define the hello endpoint
agent.method(
  "hello",
  {
    method: "post",
    input: z.object({
      name: z.string(),
    }),
    output: {
      ok: {
        description: "Greeting response",
        schema: z.object({
          message: z.string(),
          timestamp: z.string(),
        }),
      },
      err: {
        description: "Error response",
        schema: z.object({
          error: z.string(),
        }),
      },
    },
  },
  async (input, context) => {
    try {
      return {
        ok: {
          message: `Hello ${input.name}!`,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        err: {
          error: "Failed to generate greeting",
        },
      };
    }
  },
);

// Start the server
console.log("Starting test server...");
agent.run();
