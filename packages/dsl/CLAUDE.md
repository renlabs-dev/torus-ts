# Torus DSL Project Context

## Project Overview

This project involves a Domain Specific Language (DSL) for defining constraints in the Torus system. The DSL is implemented in TypeScript and uses Zod for validation.

## Recent Work

We've restructured the DSL package to improve type safety and avoid circular dependencies:

1. Created a single source of truth for types in `types.ts`
2. Made Zod schemas automatically reflect changes to DSL types
3. Eliminated circular dependencies between files
4. Added proper JSON parsing functions for constraints

## Key Files

### `/packages/dsl/src/types.ts`

Contains all core type definitions:

- Basic types: `Hash`, `UInt`, `AccountId`, `PermId`
- `CompOp` enum for comparison operators
- `NumExpr` union type for numeric expressions
- `BaseConstraint` union type for base constraints
- `BoolExpr` union type for boolean expressions
- `Constraint` interface for the main constraint type

### `/packages/dsl/src/schema.ts`

Creates Zod schemas based on the types defined in types.ts:

- Uses discriminated unions to match TypeScript types
- Handles BigInt values correctly
- Exports schemas for validation

### `/packages/dsl/src/validation.ts`

Contains validation logic:

- `validateConstraint`: Validates data against the constraint schema
- `parseConstraintJson`: Parses JSON string into a Constraint object
- `safeParseConstraintJson`: Safely parses JSON with error handling
- Custom error types: `ConstraintValidationError`, `JsonParseError`

### `/packages/dsl/src/index.ts`

Exports all types and functions:

- Re-exports types from `types.ts`
- Provides helper functions for creating constraints
- Exports validation and serialization functions

## Type Structure

The DSL uses a hierarchical type structure:

1. `Constraint` is the top-level type containing a permission ID and a boolean expression
2. `BoolExpr` represents boolean expressions (AND, OR, NOT, comparisons)
3. `BaseConstraint` represents atomic constraints (MaxDelegationDepth, PermissionExists, etc.)
4. `NumExpr` represents numeric expressions (literals, block numbers, stake amounts, etc.)

## Design Decisions

1. **Single source of truth**: All types are defined in one place (`types.ts`)
2. **Dynamic schemas**: Zod schemas are created based on TypeScript types
3. **No circular dependencies**: Careful import structure prevents circular dependencies
4. **BigInt handling**: Special handling for BigInt values in JSON

## Functions for JSON Parsing

Recently added functions for parsing JSON:

```typescript
// Parse JSON string to Constraint, throwing errors if invalid
parseConstraintJson(jsonString: string): Constraint

// Safely parse JSON string to Constraint, returning a result object
safeParseConstraintJson(jsonString: string):
  { success: true; data: Constraint } |
  { success: false; error: JsonParseError | ConstraintValidationError }
```

## Future Work Ideas

1. Add more constraint types if needed
2. Enhance the validation error messages
3. Create a visualization tool for constraints
4. Add runtime evaluation of constraints

## Testing

Tests are available in the `/packages/dsl/tests/` directory:

- Validation tests
- Schema tests
- Serialization tests
- JSON parsing tests
