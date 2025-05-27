import {
  validateConstraint, 
  ConstraintValidationError,
  Constraint,
  CompOp,
  BoolExpr,
  BaseConstraint,
  NumExpr,
  serializeConstraint,
  deserializeConstraint,
  constraintToPrimitives
} from '../src/index';

// A valid constraint represented as a regular JS object
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

// Valid constraint with string representation of numeric values (as would be received from JSON)
const validJsonConstraint = {
  permId: "permission123",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth",
      depth: {
        $: "UIntLiteral",
        value: "3" // Note: string instead of BigInt
      }
    }
  }
};

// Invalid constraint - missing depth in MaxDelegationDepth
const invalidConstraint1 = {
  permId: "permission123",
  body: {
    $: "Base",
    body: {
      $: "MaxDelegationDepth",
      // missing depth field
    }
  }
};

// Invalid constraint - invalid operator in CompExpr
const invalidConstraint2 = {
  permId: "permission456",
  body: {
    $: "CompExpr",
    op: "InvalidOp", // invalid operator
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

// Invalid constraint - missing operand in binary operation
const invalidConstraint3 = {
  permId: "permission789",
  body: {
    $: "And",
    left: {
      $: "Base",
      body: {
        $: "PermissionEnabled",
        pid: "admin"
      }
    }
    // missing right operand
  }
};

// Completely invalid object (not a constraint at all)
const invalidObject = {
  foo: "bar",
  baz: 123
};

// Invalid input (not an object)
const invalidInput = "not an object";

// Raw JSON string (as would be received from an API)
const rawJsonInput = `{
  "permId": "permission123",
  "body": {
    "$": "CompExpr",
    "op": "Gt",
    "left": {
      "$": "StakeOf",
      "account": "account123"
    },
    "right": {
      "$": "UIntLiteral",
      "value": "1000000000000000000"
    }
  }
}`;

// Helper function to test validation
function testValidation(data: any, description: string): void {
  console.log(`\nTesting: ${description}`);
  try {
    const constraint = validateConstraint(data);
    console.log("✅ Valid constraint!");
    
    // For numeric values, show they were properly converted
    if (description.includes("string") || description.includes("JSON")) {
      // For simple constraint
      if (constraint.body.$ === "Base" && 
          constraint.body.body.$ === "MaxDelegationDepth" && 
          constraint.body.body.depth.$ === "UIntLiteral") {
        console.log(`Value type: ${typeof constraint.body.body.depth.value}`);
        console.log(`Value: ${constraint.body.body.depth.value}`);
      }
      // For comparison constraint
      else if (constraint.body.$ === "CompExpr" && 
               constraint.body.right.$ === "UIntLiteral") {
        console.log(`Value type: ${typeof constraint.body.right.value}`);
        console.log(`Value: ${constraint.body.right.value}`);
      }
    }
  } catch (error) {
    if (error instanceof ConstraintValidationError) {
      console.log(`❌ Error at path: ${error.path}`);
      console.log(`   Message: ${error.message}`);
    } else {
      console.log(`❌ Unexpected error: ${error}`);
    }
  }
}

// Test all of our validation cases
console.log("=== VALIDATION TESTS ===");

// Test valid cases
testValidation(validConstraint, "Valid constraint object");
testValidation(validJsonConstraint, "Valid JSON constraint with string numbers");
testValidation(JSON.parse(rawJsonInput), "Raw JSON input (parsed)");

// Test invalid cases
testValidation(invalidConstraint1, "Invalid constraint with missing depth");
testValidation(invalidConstraint2, "Invalid constraint with invalid operator");
testValidation(invalidConstraint3, "Invalid constraint with missing operand");
testValidation(invalidObject, "Invalid object (not a constraint)");
testValidation(invalidInput, "Invalid input (not an object)");

// Create a more complex constraint for testing processing
function createComplexConstraint(): Constraint {
  return {
    permId: "complex_permission",
    body: {
      $: "And",
      left: {
        $: "Base",
        body: {
          $: "PermissionEnabled",
          pid: "admin_access"
        }
      },
      right: {
        $: "Or",
        left: {
          $: "CompExpr",
          op: CompOp.Gt,
          left: {
            $: "StakeOf",
            account: "user123"
          },
          right: {
            $: "UIntLiteral",
            value: BigInt(5000000)
          }
        },
        right: {
          $: "Not",
          body: {
            $: "Base",
            body: {
              $: "RateLimit",
              maxOperations: {
                $: "UIntLiteral",
                value: BigInt(10)
              },
              period: {
                $: "UIntLiteral",
                value: BigInt(100)
              }
            }
          }
        }
      }
    }
  };
}

// Test constraint builder API
function testBuilderAPI() {
  console.log("\n=== BUILDER API TESTS ===");
  
  try {
    // Create a constraint using the builder API
    const constraint = Constraint.create(
      "builder_test",
      BoolExpr.and(
        BoolExpr.base(
          BaseConstraint.permissionEnabled("admin_perm")
        ),
        BoolExpr.comp(
          CompOp.Gt,
          NumExpr.stakeOf("alice"),
          NumExpr.literal(1000)
        )
      )
    );
    
    console.log("✅ Builder API created constraint successfully!");
    
    // Validate the constraint to make sure it's correct
    const validated = validateConstraint(constraint);
    console.log("✅ Builder-created constraint validated successfully!");
    
  } catch (error) {
    console.log(`❌ Builder API error: ${error}`);
  }
}

// Test serialization and deserialization (imports already at the top)

function testSerialization() {
  console.log("\n=== SERIALIZATION TESTS ===");
  
  const constraint = createComplexConstraint();
  
  try {
    // Test serialization
    const serialized = serializeConstraint(constraint);
    console.log("✅ Serialized constraint successfully");
    
    // Test deserialization
    const deserialized = deserializeConstraint(serialized);
    console.log("✅ Deserialized constraint successfully");
    
    // Test validation of deserialized constraint
    const validated = validateConstraint(deserialized);
    console.log("✅ Validated deserialized constraint successfully");
    
    // Test constraintToPrimitives
    const primitiveConstraint = constraintToPrimitives(constraint);
    console.log("✅ Converted constraint to primitives successfully");
    
    // Test that primitive constraint can be stringified safely
    JSON.stringify(primitiveConstraint);
    console.log("✅ Primitive constraint can be stringified without errors");
    
  } catch (error) {
    console.log(`❌ Serialization error: ${error}`);
  }
}

// Run all tests
testBuilderAPI();
testSerialization();

// Run JSON parsing tests
import './json-parse-test';

console.log("\n=== TESTS COMPLETED ===")