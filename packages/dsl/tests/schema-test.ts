import {
  ConstraintSchema,
  validateWithZod,
  safeValidateWithZod,
  Constraint,
  CompOp,
  BoolExpr,
  BaseConstraint,
  NumExpr
} from '../src/index';
import { ZodError } from 'zod';

// Sample valid constraint
const validConstraint: Constraint = {
  permId: "permission123",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth",
      depth: {
        $: "UIntLiteral",
        value: BigInt(3)
      }
    }
  }
};

// Sample valid constraint with string number (should be converted)
const validStringConstraint = {
  permId: "permission123",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth",
      depth: {
        $: "UIntLiteral",
        value: "3" // String that should be converted to BigInt
      }
    }
  }
};

// Complex constraint with nested expressions
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
          value: "1000000000000000000" // Large number as string
        }
      },
      right: {
        $: "Base",
        body: {
          $: "RateLimit",
          maxOperations: {
            $: "UIntLiteral",
            value: 5 // Number that should be converted to BigInt
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

// Invalid constraint - wrong enum value
const invalidConstraint = {
  permId: "permission456",
  body: {
    $: "CompExpr",
    op: "InvalidOp", // Invalid - not in CompOp enum
    left: {
      $: "StakeOf",
      account: "account123"
    },
    right: {
      $: "UIntLiteral",
      value: "1000"
    }
  }
};

// Invalid constraint - missing required property
const missingPropertyConstraint = {
  permId: "permission123",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth"
      // Missing 'depth' property
    }
  }
};

// Invalid constraint - wrong discriminator
const wrongDiscriminatorConstraint = {
  permId: "permission123",
  body: {
    $: "UnknownType", // Invalid discriminator
    left: {
      $: "Base",
      body: {
        $: "PermissionEnabled",
        pid: "admin"
      }
    },
    right: {
      $: "Base",
      body: {
        $: "PermissionEnabled",
        pid: "user"
      }
    }
  }
};

// Test function for validateWithZod
function testValidateWithZod(data: unknown, description: string): void {
  console.log(`\nTesting validateWithZod: ${description}`);
  try {
    const validated = validateWithZod(data);
    console.log("✅ Validation successful!");
    
    // Check for BigInt conversion
    if (typeof data === 'object' && data !== null && 'body' in data) {
      const body = data.body as any;
      
      // Look for UIntLiteral values that should be converted
      if (body.$ === 'Base' && body.body && body.body.$ === 'MaxDelegationDepth') {
        const original = body.body.depth && body.body.depth.value;
        
        // Type guards for validated result
        if (validated.body.$ === 'Base') {
          const baseExpr = validated.body;
          if (baseExpr.body.$ === 'MaxDelegationDepth') {
            const depth = baseExpr.body.depth;
            if (depth.$ === 'UIntLiteral') {
              const converted = depth.value;
              
              if (converted !== undefined) {
                console.log(`Original value: ${original} (${typeof original})`);
                console.log(`Converted value: ${converted} (${typeof converted})`);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      console.log("❌ Validation failed with ZodError:");
      error.errors.forEach((err, index) => {
        console.log(`  Error ${index + 1}:`);
        console.log(`    Path: ${err.path.join('.')}`);
        console.log(`    Message: ${err.message}`);
      });
    } else {
      console.log(`❌ Unexpected error: ${error}`);
    }
  }
}

// Test function for safeValidateWithZod
function testSafeValidateWithZod(data: unknown, description: string): void {
  console.log(`\nTesting safeValidateWithZod: ${description}`);
  const result = safeValidateWithZod(data);
  
  if (result.success) {
    console.log("✅ Safe validation successful!");
    
    // Check for BigInt conversion in valid data
    if (typeof data === 'object' && data !== null && 'body' in data) {
      const body = data.body as any;
      
      // Check for UIntLiteral values that should be converted
      if (body.$ === 'Base' && body.body && body.body.$ === 'MaxDelegationDepth') {
        const original = body.body.depth && body.body.depth.value;
        
        // Type guards for validated result
        if (result.data.body.$ === 'Base') {
          const baseExpr = result.data.body;
          if (baseExpr.body.$ === 'MaxDelegationDepth') {
            const depth = baseExpr.body.depth;
            if (depth.$ === 'UIntLiteral') {
              const converted = depth.value;
              
              if (converted !== undefined && original !== undefined) {
                console.log(`Original value: ${original} (${typeof original})`);
                console.log(`Converted value: ${converted} (${typeof converted})`);
              }
            }
          }
        }
      }
    }
  } else {
    console.log("❌ Safe validation failed with errors:");
    result.error.errors.forEach((err, index) => {
      console.log(`  Error ${index + 1}:`);
      console.log(`    Path: ${err.path.join('.')}`);
      console.log(`    Message: ${err.message}`);
    });
  }
}

// Test constraint creation using builder pattern and Zod validation
function testBuilderWithZod(): void {
  console.log("\nTesting constraint builder with Zod validation:");
  
  try {
    // Create a constraint using the builder pattern
    const constraint = {
      permId: "builder_test",
      body: BoolExpr.and(
        BoolExpr.base(
          BaseConstraint.permissionEnabled("admin_perm")
        ),
        BoolExpr.comp(
          CompOp.Gt,
          NumExpr.stakeOf("alice"),
          NumExpr.literal(1000)
        )
      )
    };
    
    console.log("✅ Constraint created with builder API");
    
    // Validate with Zod
    const validated = validateWithZod(constraint);
    console.log("✅ Builder-created constraint passed Zod validation");
    
    // Ensure BigInt values are preserved
    let numExprValue: bigint | undefined = undefined;
    
    if (validated.body.$ === 'And') {
      const andExpr = validated.body;
      if (andExpr.right.$ === 'CompExpr') {
        const compExpr = andExpr.right;
        if (compExpr.right.$ === 'UIntLiteral') {
          numExprValue = compExpr.right.value;
        }
      }
    }
    
    if (numExprValue !== undefined) {
      console.log(`BigInt value preserved: ${numExprValue} (${typeof numExprValue})`);
    }
  } catch (error) {
    if (error instanceof ZodError) {
      console.log("❌ Zod validation failed for builder-created constraint:");
      error.errors.forEach((err) => {
        console.log(`  Path: ${err.path.join('.')}`);
        console.log(`  Message: ${err.message}`);
      });
    } else {
      console.log(`❌ Unexpected error: ${error}`);
    }
  }
}

// Run all the tests
console.log("=== ZOD SCHEMA VALIDATION TESTS ===");

// Test valid constraints
testValidateWithZod(validConstraint, "Valid constraint object");
testValidateWithZod(validStringConstraint, "Valid constraint with string number");
testValidateWithZod(complexConstraint, "Complex constraint with nested expressions");

// Test invalid constraints
testValidateWithZod(invalidConstraint, "Invalid constraint with wrong enum value");
testValidateWithZod(missingPropertyConstraint, "Invalid constraint with missing property");
testValidateWithZod(wrongDiscriminatorConstraint, "Invalid constraint with wrong discriminator");

// Test safe validation
testSafeValidateWithZod(validConstraint, "Valid constraint object (safe)");
testSafeValidateWithZod(invalidConstraint, "Invalid constraint with wrong enum value (safe)");

// Test builder API with Zod validation
testBuilderWithZod();

console.log("\n=== ZOD SCHEMA TESTS COMPLETED ===");