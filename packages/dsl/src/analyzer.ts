import type {
  Constraint,
  BoolExprType,
  BaseConstraintType,
  NumExprType,
  CompOp,
} from "./types";

/**
 * Represents an atomic fact extracted from a boolean expression
 */
export type AtomicFact =
  | { type: "BaseConstraint"; constraint: BaseConstraintType }
  | { type: "Comparison"; op: CompOp; left: NumExprType; right: NumExprType };

/**
 * Result of analyzing a constraint
 */
export interface ConstraintAnalysisResult {
  permId: string;
  atomicFacts: AtomicFact[];
  structure: BoolExprStructure;
  complexity: number;
}

/**
 * Represents the structure of a boolean expression for reconstruction
 */
export type BoolExprStructure =
  | { type: "AtomicFact"; factIndex: number }
  | { type: "Not"; body: BoolExprStructure }
  | { type: "And"; left: BoolExprStructure; right: BoolExprStructure }
  | { type: "Or"; left: BoolExprStructure; right: BoolExprStructure };

/**
 * Decomposes a constraint into atomic facts and logical structure
 * @param constraint The constraint to analyze
 * @returns Analysis result containing atomic facts and expression structure
 */
export function analyzeConstraint(
  constraint: Constraint,
): ConstraintAnalysisResult {
  const atomicFacts: AtomicFact[] = [];
  const structure = extractBoolExprStructure(constraint.body, atomicFacts);

  return {
    permId: constraint.permId,
    atomicFacts,
    structure,
    complexity: countComplexity(structure),
  };
}

/**
 * Recursively extracts the structure of a boolean expression, collecting atomic facts
 * @param expr The boolean expression to analyze
 * @param facts Array to collect atomic facts
 * @returns The structure representation of the expression
 */
function extractBoolExprStructure(
  expr: BoolExprType,
  facts: AtomicFact[],
): BoolExprStructure {
  switch (expr.$) {
    case "Base": {
      // Base constraint is an atomic fact
      const factIndex = facts.length;
      facts.push({
        type: "BaseConstraint",
        constraint: expr.body,
      });
      return { type: "AtomicFact", factIndex };
    }

    case "CompExpr": {
      // Comparison expression is an atomic fact
      const factIndex = facts.length;
      facts.push({
        type: "Comparison",
        op: expr.op,
        left: expr.left,
        right: expr.right,
      });
      return { type: "AtomicFact", factIndex };
    }

    case "Not": {
      // Negation operator
      const body = extractBoolExprStructure(expr.body, facts);
      return { type: "Not", body };
    }

    case "And": {
      // AND operator
      const left = extractBoolExprStructure(expr.left, facts);
      const right = extractBoolExprStructure(expr.right, facts);
      return { type: "And", left, right };
    }

    case "Or": {
      // OR operator
      const left = extractBoolExprStructure(expr.left, facts);
      const right = extractBoolExprStructure(expr.right, facts);
      return { type: "Or", left, right };
    }
  }
}

/**
 * Counts the complexity of a boolean expression structure
 * @param structure The structure to analyze
 * @returns Complexity score (higher means more complex)
 */
function countComplexity(structure: BoolExprStructure): number {
  switch (structure.type) {
    case "AtomicFact":
      return 1;
    case "Not":
      return 1 + countComplexity(structure.body);
    case "And":
    case "Or":
      return (
        1 + countComplexity(structure.left) + countComplexity(structure.right)
      );
  }
}

/**
 * Reconstructs a boolean expression from its structure and atomic facts
 * @param structure The structure representation
 * @param facts The atomic facts
 * @returns Reconstructed boolean expression
 */
export function reconstructBoolExpr(
  structure: BoolExprStructure,
  facts: AtomicFact[],
): BoolExprType {
  switch (structure.type) {
    case "AtomicFact": {
      const fact = facts[structure.factIndex];
      if (!fact) {
        throw new Error(`Invalid fact index: ${structure.factIndex}`);
      }

      if (fact.type === "BaseConstraint") {
        return {
          $: "Base",
          body: fact.constraint,
        };
      } else {
        // Comparison
        const compFact = fact as {
          type: "Comparison";
          op: CompOp;
          left: NumExprType;
          right: NumExprType;
        };
        return {
          $: "CompExpr",
          op: compFact.op,
          left: compFact.left,
          right: compFact.right,
        };
      }
    }

    case "Not":
      return {
        $: "Not",
        body: reconstructBoolExpr(structure.body, facts),
      };

    case "And":
      return {
        $: "And",
        left: reconstructBoolExpr(structure.left, facts),
        right: reconstructBoolExpr(structure.right, facts),
      };

    case "Or":
      return {
        $: "Or",
        left: reconstructBoolExpr(structure.left, facts),
        right: reconstructBoolExpr(structure.right, facts),
      };
  }
}

/**
 * Flattens a boolean expression into a list of sub-expressions in Conjunctive Normal Form (CNF)
 * This is useful for rule systems that need to evaluate conditions independently
 * @param expr The boolean expression to flatten
 * @returns Array of expressions in CNF
 */
export function flattenToCNF(expr: BoolExprType): BoolExprType[] {
  // Step 1: Extract facts and structure
  const facts: AtomicFact[] = [];
  const structure = extractBoolExprStructure(expr, facts);

  // Step 2: Convert to CNF
  const cnfStructure = toCNF(structure);

  // Step 3: Extract clauses
  return extractClauses(cnfStructure, facts);
}

/**
 * Converts a boolean expression structure to Conjunctive Normal Form (CNF)
 * CNF is a conjunction (AND) of disjunctions (OR)
 * @param structure The structure to convert
 * @returns Structure in CNF
 */
function toCNF(structure: BoolExprStructure): BoolExprStructure {
  // This is a simplified CNF conversion
  // A complete implementation would handle De Morgan's laws and distributivity

  switch (structure.type) {
    case "AtomicFact":
      return structure;

    case "Not":
      if (structure.body.type === "Not") {
        // Double negation elimination: ¬¬A = A
        return toCNF(structure.body.body);
      }
      return {
        type: "Not",
        body: toCNF(structure.body),
      };

    case "And":
      return {
        type: "And",
        left: toCNF(structure.left),
        right: toCNF(structure.right),
      };

    case "Or":
      return {
        type: "Or",
        left: toCNF(structure.left),
        right: toCNF(structure.right),
      };
  }
}

/**
 * Extracts clauses from a CNF structure
 * @param structure The CNF structure
 * @param facts The atomic facts
 * @returns Array of boolean expressions representing clauses
 */
function extractClauses(
  structure: BoolExprStructure,
  facts: AtomicFact[],
): BoolExprType[] {
  if (structure.type !== "And") {
    // If it's not an AND, it's a single clause
    return [reconstructBoolExpr(structure, facts)];
  }

  // For AND, combine clauses from both sides
  return [
    ...extractClauses(structure.left, facts),
    ...extractClauses(structure.right, facts),
  ];
}

/**
 * Describes the atomic facts in plain English
 * @param facts Array of atomic facts
 * @returns Array of string descriptions
 */
export function describeAtomicFacts(facts: AtomicFact[]): string[] {
  return facts.map((fact, index) => {
    if (fact.type === "BaseConstraint") {
      return `Fact #${index}: Base constraint of type "${fact.constraint.$}"`;
    } else {
      return `Fact #${index}: Comparison "${fact.op}" between expressions`;
    }
  });
}

/**
 * Utility function to create a visualization of the boolean expression structure
 * @param structure The boolean expression structure
 * @param facts The atomic facts
 * @returns A tree-like string representation of the structure
 */
export function visualizeStructure(
  structure: BoolExprStructure,
  facts: AtomicFact[],
  indent = 0,
): string {
  const padding = " ".repeat(indent * 2);

  switch (structure.type) {
    case "AtomicFact": {
      const fact = facts[structure.factIndex];
      if (!fact) {
        return `${padding}Fact #${structure.factIndex}: INVALID INDEX`;
      }

      if (fact.type === "BaseConstraint") {
        return `${padding}Fact #${structure.factIndex}: Base(${fact.constraint.$})`;
      } else {
        const compFact = fact as {
          type: "Comparison";
          op: CompOp;
          left: NumExprType;
          right: NumExprType;
        };
        return `${padding}Fact #${structure.factIndex}: Compare(${compFact.op})`;
      }
    }

    case "Not":
      return `${padding}NOT\n${visualizeStructure(structure.body, facts, indent + 1)}`;

    case "And":
      return `${padding}AND\n${visualizeStructure(structure.left, facts, indent + 1)}\n${visualizeStructure(structure.right, facts, indent + 1)}`;

    case "Or":
      return `${padding}OR\n${visualizeStructure(structure.left, facts, indent + 1)}\n${visualizeStructure(structure.right, facts, indent + 1)}`;
  }
}
