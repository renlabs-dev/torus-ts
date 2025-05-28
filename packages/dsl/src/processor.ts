import type { 
  Constraint, 
  BoolExprType, 
  BaseConstraintType,
  NumExprType
} from "./types";
import { CompOp } from "./types";

/**
 * Analysis result for a constraint
 */
export interface ConstraintAnalysis {
  permId: string;
  complexity: number;
  type: string;
  description: string;
  operations: string[];
}

/**
 * Process a constraint by analyzing its structure and providing useful information
 * @param constraint The constraint to process
 * @returns Analysis results including complexity and descriptions
 */
export function processConstraint(constraint: Constraint): {
  constraint: Constraint;
  analysis: ConstraintAnalysis;
} {
  const analysis = analyzeConstraint(constraint);
  
  return {
    constraint,
    analysis,
  };
}

/**
 * Analyzes a constraint's structure to provide insight into its complexity and purpose
 * @param constraint The constraint to analyze
 * @returns Analysis data for the constraint
 */
function analyzeConstraint(constraint: Constraint): ConstraintAnalysis {
  const { permId, body } = constraint;
  
  // Default analysis
  const analysis: ConstraintAnalysis = {
    permId,
    complexity: 1,
    type: "Unknown",
    description: "Generic constraint",
    operations: [],
  };
  
  // Analyze the boolean expression
  analyzeExpr(body, analysis);
  
  return analysis;
}

/**
 * Recursively analyzes a boolean expression and updates the analysis object
 * @param expr The boolean expression to analyze
 * @param analysis The analysis object to update
 */
function analyzeExpr(expr: BoolExprType, analysis: ConstraintAnalysis): void {
  switch(expr.$) {
    case "Base":
      analyzeBase(expr.body, analysis);
      break;
    case "And":
      analysis.complexity += 1;
      analysis.operations.push("AND");
      analyzeExpr(expr.left, analysis);
      analyzeExpr(expr.right, analysis);
      break;
    case "Or":
      analysis.complexity += 1;
      analysis.operations.push("OR");
      analyzeExpr(expr.left, analysis);
      analyzeExpr(expr.right, analysis);
      break;
    case "Not":
      analysis.complexity += 1;
      analysis.operations.push("NOT");
      analyzeExpr(expr.body, analysis);
      break;
    case "CompExpr":
      analysis.complexity += 1;
      analysis.operations.push(`COMPARISON (${expr.op})`);
      break;
  }
}

/**
 * Analyzes a base constraint and updates the analysis object with type and description
 * @param base The base constraint to analyze
 * @param analysis The analysis object to update
 */
function analyzeBase(base: BaseConstraintType, analysis: ConstraintAnalysis): void {
  switch(base.$) {
    case "MaxDelegationDepth":
      analysis.type = "Delegation Depth Limit";
      analysis.description = "Limits the maximum delegation depth";
      break;
    case "PermissionExists":
      analysis.type = "Permission Requirement";
      analysis.description = `Requires permission ${base.pid} to exist`;
      break;
    case "PermissionEnabled":
      analysis.type = "Permission Requirement";
      analysis.description = `Requires permission ${base.pid} to be enabled`;
      break;
    case "RateLimit":
      analysis.type = "Rate Limit";
      analysis.description = "Applies a rate limit to operations";
      break;
    case "InactiveUnlessRedelegated":
      analysis.type = "Delegation Condition";
      analysis.description = "Inactive unless redelegated";
      break;
  }
}

/**
 * Creates a sample constraint for testing purposes
 * @returns A sample complex constraint
 */
export function createSampleConstraint(): Constraint {
  // Create a complex constraint example
  return {
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
          op: CompOp.Gt,
          left: {
            $: "StakeOf",
            account: "account123"
          },
          right: {
            $: "UIntLiteral",
            value: BigInt(1000)
          }
        },
        right: {
          $: "Base",
          body: {
            $: "RateLimit",
            maxOperations: {
              $: "UIntLiteral",
              value: BigInt(5)
            },
            period: {
              $: "UIntLiteral",
              value: BigInt(100)
            }
          }
        }
      }
    }
  };
}