import { parseConstraintJson, safeParseConstraintJson, JsonParseError, ConstraintValidationError } from '../src/validation';
import { CompOp } from '../src/types';

console.log("\n=== JSON PARSING TESTS ===");

function runTest(name: string, fn: () => void): void {
  try {
    console.log(`\nTesting: ${name}`);
    fn();
  } catch (error) {
    console.error(`❌ Test failed: ${error}`);
  }
}

// Valid JSON constraint test
runTest("Parse valid JSON constraint", () => {
  const jsonString = `{
    "permId": "test-permission",
    "body": {
      "$": "CompExpr",
      "op": "Gt",
      "left": {
        "$": "UIntLiteral",
        "value": "1000"
      },
      "right": {
        "$": "UIntLiteral",
        "value": 500
      }
    }
  }`;

  const constraint = parseConstraintJson(jsonString);
  
  if (
    constraint.permId !== "test-permission" ||
    constraint.body.$ !== "CompExpr" ||
    constraint.body.op !== CompOp.Gt
  ) {
    throw new Error("Parsed constraint does not match expected values");
  }
  
  console.log("✅ Successfully parsed valid JSON constraint");
  
  // Check BigInt conversion
  const leftValue = (constraint.body as any).left.value;
  const rightValue = (constraint.body as any).right.value;
  
  console.log(`Left value type: ${typeof leftValue}, value: ${leftValue}`);
  console.log(`Right value type: ${typeof rightValue}, value: ${rightValue}`);
  
  if (typeof leftValue !== 'bigint' || leftValue !== 1000n) {
    throw new Error("String value was not converted to BigInt correctly");
  }
  
  if (typeof rightValue !== 'bigint' || rightValue !== 500n) {
    throw new Error("Number value was not converted to BigInt correctly");
  }
  
  console.log("✅ BigInt conversion successful");
});

// Invalid JSON syntax test
runTest("Parse invalid JSON syntax", () => {
  const invalidJson = `{
    "permId": "test-permission",
    "body": {
      "$": "CompExpr",
      "op": "Gt"
      "left": { // Missing comma
        "$": "UIntLiteral",
        "value": "1000"
      },
      "right": {
        "$": "UIntLiteral",
        "value": 500
      }
    }
  }`;

  try {
    parseConstraintJson(invalidJson);
    throw new Error("Should have thrown JsonParseError");
  } catch (error) {
    if (!(error instanceof JsonParseError)) {
      throw new Error(`Expected JsonParseError but got ${error}`);
    }
    console.log(`✅ Correctly threw JsonParseError: ${error.message}`);
  }
});

// Invalid constraint structure test
runTest("Parse invalid constraint structure", () => {
  const invalidConstraint = `{
    "permId": "test-permission",
    "body": {
      "$": "CompExpr",
      "op": "InvalidOperator",
      "left": {
        "$": "UIntLiteral",
        "value": "1000"
      },
      "right": {
        "$": "UIntLiteral",
        "value": 500
      }
    }
  }`;

  try {
    parseConstraintJson(invalidConstraint);
    throw new Error("Should have thrown ConstraintValidationError");
  } catch (error) {
    if (!(error instanceof ConstraintValidationError)) {
      throw new Error(`Expected ConstraintValidationError but got ${error}`);
    }
    console.log(`✅ Correctly threw ConstraintValidationError: ${error.message}`);
  }
});

// Safe parsing test - valid JSON
runTest("Safe parse valid JSON", () => {
  const validJson = `{
    "permId": "test-permission",
    "body": {
      "$": "Base",
      "body": {
        "$": "MaxDelegationDepth",
        "depth": {
          "$": "UIntLiteral",
          "value": 5
        }
      }
    }
  }`;

  const result = safeParseConstraintJson(validJson);
  
  if (!result.success) {
    throw new Error(`Expected success but got error: ${result.error.message}`);
  }
  
  console.log("✅ Successfully safe-parsed valid JSON constraint");
});

// Safe parsing test - invalid JSON
runTest("Safe parse invalid JSON", () => {
  const invalidJson = `{
    "permId": "test-permission",
    "body": {
      // Missing required fields
    }
  }`;

  const result = safeParseConstraintJson(invalidJson);
  
  if (result.success) {
    throw new Error("Expected failure but got success");
  }
  
  console.log(`✅ Correctly returned error in safe parse: ${result.error.message}`);
});

console.log("\n=== JSON PARSING TESTS COMPLETED ===");