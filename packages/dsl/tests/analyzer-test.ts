import {
  Constraint,
  BoolExpr,
  BaseConstraint,
  NumExpr,
  CompOp,
  analyzeConstraint,
  reconstructBoolExpr,
  flattenToCNF,
  describeAtomicFacts,
  visualizeStructure,
  AtomicFact
} from '../src/index';

// Helper function to create a complex constraint for testing
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

// Helper function to create a nested AND constraint
function createNestedAndConstraint(): Constraint {
  return {
    permId: "nested_and_permission",
    body: {
      $: "And",
      left: {
        $: "And",
        left: {
          $: "Base",
          body: {
            $: "PermissionEnabled",
            pid: "basic_access"
          }
        },
        right: {
          $: "Base",
          body: {
            $: "PermissionEnabled",
            pid: "advanced_access"
          }
        }
      },
      right: {
        $: "Base",
        body: {
          $: "PermissionEnabled",
          pid: "admin_access"
        }
      }
    }
  };
}

// Test constraint analysis and factorization
function testAnalyzeConstraint() {
  console.log("\n=== CONSTRAINT ANALYSIS TEST ===");
  
  // Create a complex constraint
  const constraint = createComplexConstraint();
  
  // Analyze the constraint
  const analysis = analyzeConstraint(constraint);
  
  console.log(`Permission ID: ${analysis.permId}`);
  console.log(`Complexity: ${analysis.complexity}`);
  console.log("\nAtomic Facts:");
  
  // Print each atomic fact
  const factDescriptions = describeAtomicFacts(analysis.atomicFacts);
  factDescriptions.forEach(desc => console.log(`- ${desc}`));
  
  // Visualize the structure
  console.log("\nExpression Structure:");
  console.log(visualizeStructure(analysis.structure, analysis.atomicFacts));
  
  // Verify reconstruction works
  const reconstructed = reconstructBoolExpr(analysis.structure, analysis.atomicFacts);
  // Deep compare without using JSON.stringify (which can't handle BigInt)
  const isEqual = compareExpressions(reconstructed, constraint.body);
  console.log("\nReconstruction successful:", isEqual);
}

// Helper function to compare expressions (since JSON.stringify can't handle BigInt)
function compareExpressions(expr1: BoolExpr, expr2: BoolExpr): boolean {
  // Check expression type
  if (expr1.$ !== expr2.$) return false;
  
  switch (expr1.$) {
    case 'Base': {
      const base1 = expr1.body;
      const base2 = (expr2 as typeof expr1).body;
      
      // Check base constraint type
      if (base1.$ !== base2.$) return false;
      
      // Compare specific properties based on constraint type
      switch (base1.$) {
        case 'MaxDelegationDepth':
          return compareNumExprs(base1.depth, (base2 as typeof base1).depth);
          
        case 'PermissionExists':
        case 'PermissionEnabled':
          return base1.pid === (base2 as typeof base1).pid;
          
        case 'RateLimit':
          return compareNumExprs(base1.maxOperations, (base2 as typeof base1).maxOperations) &&
                 compareNumExprs(base1.period, (base2 as typeof base1).period);
                 
        case 'InactiveUnlessRedelegated':
          return true; // No properties to compare
      }
      break;
    }
    
    case 'CompExpr': {
      const comp1 = expr1;
      const comp2 = expr2 as typeof comp1;
      
      return comp1.op === comp2.op &&
             compareNumExprs(comp1.left, comp2.left) &&
             compareNumExprs(comp1.right, comp2.right);
    }
    
    case 'Not': {
      const not1 = expr1;
      const not2 = expr2 as typeof not1;
      
      return compareExpressions(not1.body, not2.body);
    }
    
    case 'And':
    case 'Or': {
      const bin1 = expr1;
      const bin2 = expr2 as typeof bin1;
      
      return compareExpressions(bin1.left, bin2.left) &&
             compareExpressions(bin1.right, bin2.right);
    }
  }
  
  return false;
}

// Helper function to compare numeric expressions
function compareNumExprs(expr1: NumExpr, expr2: NumExpr): boolean {
  // Check expression type
  if (expr1.$ !== expr2.$) return false;
  
  switch (expr1.$) {
    case 'UIntLiteral':
      return expr1.value === (expr2 as typeof expr1).value;
      
    case 'BlockNumber':
      return true; // No properties to compare
      
    case 'StakeOf':
      return expr1.account === (expr2 as typeof expr1).account;
      
    case 'Add':
    case 'Sub':
      return compareNumExprs(expr1.left, (expr2 as typeof expr1).left) &&
             compareNumExprs(expr1.right, (expr2 as typeof expr1).right);
             
    case 'WeightSet':
    case 'WeightPowerFrom':
      return expr1.from === (expr2 as typeof expr1).from &&
             expr1.to === (expr2 as typeof expr1).to;
  }
  
  return false;
}

// Test flattening to CNF
function testFlattenToCNF() {
  console.log("\n=== CNF FLATTENING TEST ===");
  
  // Create a nested AND constraint
  const constraint = createNestedAndConstraint();
  console.log("Original constraint structure:");
  
  // Analyze the constraint
  const analysis = analyzeConstraint(constraint);
  console.log(visualizeStructure(analysis.structure, analysis.atomicFacts));
  
  // Flatten to CNF
  const clauses = flattenToCNF(constraint.body);
  
  console.log(`\nFlattened into ${clauses.length} clauses:`);
  clauses.forEach((clause, index) => {
    console.log(`\nClause #${index + 1}:`);
    // Analyze each clause
    const clauseAnalysis = analyzeConstraint({
      permId: "clause",
      body: clause
    });
    console.log(visualizeStructure(clauseAnalysis.structure, clauseAnalysis.atomicFacts));
  });
}

// Function to demonstrate how this can be used for rule-based systems
function demonstrateRuleSystem() {
  console.log("\n=== RULE-BASED SYSTEM DEMO ===");
  
  // Create a complex constraint
  const constraint = createComplexConstraint();
  
  // Analyze the constraint
  const analysis = analyzeConstraint(constraint);
  
  console.log("For a RETE algorithm, each atomic fact becomes a condition node:");
  analysis.atomicFacts.forEach((fact, index) => {
    if (fact.type === 'BaseConstraint') {
      console.log(`\nNode #${index}: Base Constraint`);
      console.log(`Type: ${fact.constraint.$}`);
      if ('pid' in fact.constraint) {
        console.log(`Permission ID: ${fact.constraint.pid}`);
      }
    } else {
      console.log(`\nNode #${index}: Comparison`);
      console.log(`Operator: ${fact.op}`);
      console.log(`Left operand type: ${fact.left.$}`);
      console.log(`Right operand type: ${fact.right.$}`);
    }
  });
  
  console.log("\nThe structure represents how these nodes are connected:");
  console.log(visualizeStructure(analysis.structure, analysis.atomicFacts));
  
  console.log("\nIn a RETE network, you would:");
  console.log("1. Create alpha nodes for each atomic fact");
  console.log("2. Create beta nodes for joining conditions (AND nodes)");
  console.log("3. Create NOT nodes for negation");
  console.log("4. Create OR nodes as needed");
  console.log("5. Connect to a terminal node for the rule action");
}

// Run all tests
console.log("=== BOOLEAN EXPRESSION ANALYSIS TESTS ===");
testAnalyzeConstraint();
testFlattenToCNF();
demonstrateRuleSystem();
console.log("\n=== TESTS COMPLETED ===");