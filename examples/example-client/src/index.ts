import { z } from "zod";

import { Agent } from "@torus-network/sdk";

const agent = new Agent({
  agentKey: "5FgfC2DY4yreEWEughz46RZYQ8oBhHVqD9fVq6gV89E6z4Ea", // Your agent's SS58 address
  port: 3000,
  docs: {
    info: {
      title: "Alice Memory Agent",
      version: "1.0.0",
    },
  },
});

// Define a simple endpoint
agent.method(
  "hello",
  {
    input: z.object({
      name: z.string().min(1).max(50),
    }),
    output: {
      ok: {
        description: "Greeting response",
        schema: z.object({
          message: z.string(),
          timestamp: z.number(),
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
    return {
      ok: {
        message: `Hello ${input.name}!`,
        timestamp: Date.now(),
      },
    };
  },
);

// Start the server
agent.run();
