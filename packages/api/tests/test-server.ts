#!/usr/bin/env tsx

import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { constraintRouter } from './src/router/constraint/constraint';
import { createTRPCMsw } from 'msw-trpc';
import { z } from 'zod';

// Create a simple tRPC router for testing
import { initTRPC } from '@trpc/server';

const t = initTRPC.create();

// Create test router with constraint endpoints
const testAppRouter = t.router({
  constraint: constraintRouter,
});

export type TestAppRouter = typeof testAppRouter;

// Create HTTP server
const server = createHTTPServer({
  router: testAppRouter,
  createContext: () => ({
    // Mock authenticated context
    user: { id: 'test-user' },
  }),
});

const PORT = 3001;

console.log(`🚀 Starting tRPC test server on http://localhost:${PORT}`);

server.listen(PORT);

export { testAppRouter };