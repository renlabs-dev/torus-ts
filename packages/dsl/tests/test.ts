import { 
  Constraint, 
  NumExpr, 
  BaseConstraint, 
  BoolExpr, 
  CompOp,
  processConstraint,
  createSampleConstraint
} from './index';

// Create a simple constraint
const simpleConstraint: Constraint = {
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

// Create a more complex constraint
const complexConstraint: Constraint = {
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
      $: "CompExpr",
      op: CompOp.Gt,
      left: {
        $: "StakeOf",
        account: "account123"
      },
      right: {
        $: "UIntLiteral",
        value: BigInt(1000)
      }
    }
  }
};

// Test constraint processor
console.log("Processing simple constraint:");
const simpleResult = processConstraint(simpleConstraint);
console.log(JSON.stringify(simpleResult, (key, value) => 
  typeof value === 'bigint' ? value.toString() : value, 2));

console.log("\nProcessing complex constraint:");
const complexResult = processConstraint(complexConstraint);
console.log(JSON.stringify(complexResult, (key, value) => 
  typeof value === 'bigint' ? value.toString() : value, 2));

console.log("\nSample constraint from factory function:");
const sampleConstraint = createSampleConstraint();
console.log(JSON.stringify(sampleConstraint, (key, value) => 
  typeof value === 'bigint' ? value.toString() : value, 2));