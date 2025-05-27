import { 
  validateConstraint, 
  ConstraintValidationError,
  Constraint,
  CompOp
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