// Import required dependencies - Note this requires Node.js v16+
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

// Create a test client
const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3100/trpc',
    }),
  ],
  transformer: superjson,
});

async function testApi() {
  try {
    // Test the hello endpoint without parameters
    const helloResult = await client.portal.hello.query();
    console.log('Hello result:', helloResult);
    
    // Test the helloName endpoint with a name parameter
    const helloNameResult = await client.portal.helloName.query({ name: 'Jairo' });
    console.log('Hello with name result:', helloNameResult);
    
    // Test the dslTest endpoint
    const dslTestResult = await client.portal.dslTest.query();
    console.log('DSL test result:', dslTestResult);
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi();