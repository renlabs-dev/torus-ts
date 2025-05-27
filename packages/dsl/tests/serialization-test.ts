import { 
  serializeConstraint, 
  deserializeConstraint,
  constraintToPrimitives,
  convertStringsToBigInt,
  Constraint,
  CompOp,
  NumExpr
} from '../src/index';

// Create a constraint with BigInt values
const constraint: Constraint = {
  permId: "permission123",
  body: {
    $: "And",
    left: {
      $: "Base",
      body: {
        $: "MaxDelegationDepth",
        depth: {
          $: "UIntLiteral",
          value: BigInt(10)
        }
      }
    },
    right: {
      $: "CompExpr",
      op: CompOp.Gt,
      left: {
        $: "StakeOf",
        account: "account123"
      },
      right: {
        $: "UIntLiteral",
        value: BigInt(1000000000000000000) // 1 with 18 zeros (large number)
      }
    }
  }
};

// Test serialization
console.log("Original constraint:");
console.log(constraint);

console.log("\nSerializing constraint to JSON:");
const serialized = serializeConstraint(constraint);
console.log(serialized);

console.log("\nDeserializing constraint from JSON:");
const deserialized = deserializeConstraint(serialized);
console.log(deserialized);

console.log("\nConvert to primitives (for JSON):");
const primitives = constraintToPrimitives(constraint);
console.log(JSON.stringify(primitives, null, 2));

console.log("\nConvert string values back to BigInt:");
const reconstructed = convertStringsToBigInt(primitives);
console.log(reconstructed);

// Verify that the reconstructed object has BigInt values
console.log("\nVerifying BigInt values in reconstructed object:");
const uintLiteral = (reconstructed.body.right as any).right as NumExpr & { $: "UIntLiteral" };
console.log(`Value type: ${typeof uintLiteral.value}`);
console.log(`Value: ${uintLiteral.value}`);