import { z } from 'zod';
import { Agent } from '../agent/index.js';

const agent = new Agent({
  address: 'test-agent-address',
  port: 3002,
  auth: {
    jwtMaxAge: 300
  },
  docs: {
    info: {
      title: 'Authenticated Test Agent API',
      version: '1.0.0'
    }
  }
});

agent.method('hello', {
  method: 'post',
  auth: {
    required: true
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

console.log('Starting authenticated test server on port 3002...');
agent.run();