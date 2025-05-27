// Import required dependencies
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

// Valid constraint example
const validConstraint = {
  permId: "permission123",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth",
      depth: {
        $: "UIntLiteral",
        value: 3
      }
    }
  }
};

// Invalid constraint example (incorrect field name)
const invalidConstraint = {
  permId: "permission456",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth",
      // 'depth' field is missing, using 'max' instead which is not part of the schema
      max: {
        $: "UIntLiteral",
        value: 5
      }
    }
  }
};

async function testValidation() {
  try {
    console.log("Testing valid constraint...");
    const validResult = await client.portal.validateConstraint.mutate(validConstraint);
    console.log("Valid constraint result:", validResult);
    
    console.log("\nTesting invalid constraint...");
    try {
      const invalidResult = await client.portal.validateConstraint.mutate(invalidConstraint);
      console.log("Invalid constraint result:", invalidResult);
    } catch (error) {
      console.log("Validation error (expected):", error.message);
    }
  } catch (error) {
    console.error("Error testing validation:", error);
  }
}

// Run the tests
testValidation();