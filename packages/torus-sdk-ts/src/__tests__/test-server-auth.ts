import { z } from "zod";

import type { SS58Address } from "@torus-network/sdk/types";

import { Agent } from "../agent/index.js";

const agent = new Agent({
  agentKey: "5D5FbRRUvQxdQnJLgNW6BdgZ86CRGreKRahzhxmdSj2REBnt" as SS58Address, // Mock agent key for testing
  port: 3002,
  auth: {
    jwtMaxAge: 300,
  },
  docs: {
    info: {
      title: "Authenticated Test Agent API",
      version: "1.0.0",
    },
  },
});

agent.method(
  "hello",
  {
    method: "post",
    auth: {
      required: true,
    },
    namespace: {
      enabled: true,
      rpcUrls: ["wss://api.testnet.torus.network"],
    },
    input: z.object({
      name: z.string(),
    }),
    output: {
      ok: {
        description: "Authenticated greeting response",
        schema: z.object({
          message: z.string(),
          timestamp: z.string(),
          userAddress: z.string(),
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
          userAddress: context.user?.walletAddress || "unknown",
        },
      };
    } catch (error) {
      return {
        err: {
          error: "Failed to generate authenticated greeting",
        },
      };
    }
  },
);

// Add a test endpoint with a namespace that definitely won't exist
agent.method(
  "restricted-namespace-test-el-psy-congroo",
  {
    method: "post",
    auth: {
      required: true,
    },
    namespace: {
      enabled: true,
      rpcUrls: ["wss://api.testnet.torus.network"],
    },
    input: z.object({
      message: z.string(),
    }),
    output: {
      ok: {
        description: "This should never be returned",
        schema: z.object({
          result: z.string(),
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
  async (input) => {
    // This should never be reached if namespace permissions are working
    return {
      ok: {
        result: `This shouldn't happen - received: ${input.message}`,
      },
    };
  },
);

console.log("Starting authenticated test server on port 3002...");
agent.run();
