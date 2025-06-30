import { z } from 'zod';
import { Agent } from '../agent/index.js';

// Create a test server with authenticated hello endpoint
const agent = new Agent({
  address: 'test-agent-address',
  port: 3002, // Different port to avoid conflicts
  docs: {
    info: {
      title: 'Authenticated Test Agent API',
      version: '1.0.0'
    }
  }
});

// Define the authenticated hello endpoint
agent.method('hello', {
  method: 'post',
  auth: {
    required: true // Require authentication
  },
  input: z.object({
    name: z.string()
  }),
  output: {
    ok: {
      description: 'Authenticated greeting response',
      schema: z.object({
        message: z.string(),
        timestamp: z.string(),
        userAddress: z.string()
      })
    },
    err: {
      description: 'Error response',
      schema: z.object({
        error: z.string()
      })
    }
  }
}, async (input, context) => {
  try {
    return {
      ok: {
        message: `Hello ${input.name}! You are authenticated as ${context.user?.walletAddress}`,
        timestamp: new Date().toISOString(),
        userAddress: context.user?.walletAddress || 'unknown'
      }
    };
  } catch (error) {
    return {
      err: {
        error: 'Failed to generate authenticated greeting'
      }
    };
  }
});

// Start the server
console.log('Starting authenticated test server on port 3002...');
agent.run();