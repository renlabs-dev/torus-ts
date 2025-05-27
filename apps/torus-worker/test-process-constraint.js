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

// Example constraints for testing
const simpleConstraint = {
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

const complexConstraint = {
  permId: "permission456",
  body: {
    $: "And",
    left: {
      $: "Base",
      body: {
        $: "PermissionEnabled",
        pid: "admin"
      }
    },
    right: {
      $: "Or",
      left: {
        $: "CompExpr",
        op: "Gt",
        left: {
          $: "StakeOf",
          account: "account123"
        },
        right: {
          $: "UIntLiteral",
          value: 1000
        }
      },
      right: {
        $: "Base",
        body: {
          $: "RateLimit",
          maxOperations: {
            $: "UIntLiteral",
            value: 5
          },
          period: {
            $: "UIntLiteral",
            value: 100
          }
        }
      }
    }
  }
};

// Test invalid constraint (missing required field)
const invalidConstraint = {
  permId: "permission789",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth",
      // Missing 'depth' field which is required
      max: {
        $: "UIntLiteral",
        value: 5
      }
    }
  }
};

async function testProcessConstraint() {
  try {
    console.log("Testing simple constraint...");
    const simpleResult = await client.portal.processConstraint.mutate(simpleConstraint);
    console.log(JSON.stringify(simpleResult, null, 2));
    
    console.log("\nTesting complex constraint...");
    const complexResult = await client.portal.processConstraint.mutate(complexConstraint);
    console.log(JSON.stringify(complexResult, null, 2));
    
    console.log("\nTesting invalid constraint...");
    try {
      const invalidResult = await client.portal.processConstraint.mutate(invalidConstraint);
      console.log(JSON.stringify(invalidResult, null, 2));
    } catch (error) {
      console.log("Validation error (expected):", error.message);
    }
  } catch (error) {
    console.error("Error testing constraints:", error);
  }
}

// Run the tests
testProcessConstraint();