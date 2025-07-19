# Torus SDK core Substrate modules

Core modules for interacting with the Torus Substrate blockchain pallets. Each
module provides Zod schemas, TypeScript type definitions, query and transaction
functions, and utilities for a specific pallet.

## Module Overview

All modules follow consistent patterns:

- **Zod Schema Validation**
  - Substrate type parsers defined using `sb_` prefixed utilities
- **Type Inference**
  - Types inferred from Zod schemas using `z.infer<typeof SCHEMA>`
- **Error Handling**
  - Robust error handling with `tryAsync` and `trySync` wrappers etc
- **Query Functions**
  - Standardized functions for blockchain data retrieval

## Files

- [@_common.ts] - Shared utilities and types for storage map parsing
- [@subspace.ts] - Misc pallet interface (balances, staking, emission, agents)
  (needs to be split, the name is outdated)
- [@governance.ts] - Governance pallet interface (proposals, voting,
  applications)
- [@permission0.ts] - Permission0 pallet interface (delegation permissions)

## Type System Conventions

### Substrate Type Utilities

All modules use standardized substrate type utilities from `../types/zod.ts`:

- `sb_struct()`: Substrate structs
- `sb_enum()`: Substrate enums with variants
- `sb_address`: SS58 addresses
- `sb_bigint`: BigInt values
- `sb_string`: UTF-8 strings
- `sb_array()`: Arrays/vectors
- `sb_bool`: Booleans
- `sb_null`: Null/unit type
- `sb_option()`: Optional values
- `sb_some()`: Non-null options
- `sb_h256`: Hash values
- `sb_id`: Numeric IDs
- `sb_blocks`: Block numbers
- `sb_balance`: Token balances
- `sb_percent`: Percentage values

### Schema Definition Pattern

```ts
// 1. Define Zod schema
export const DATA_SCHEMA = sb_struct({
  field1: sb_address,
  field2: sb_bigint,
  nested: sb_enum({
    Variant1: sb_null,
    Variant2: sb_struct({ value: sb_balance }),
  }),
});

// 2. Infer TypeScript type
export type Data = z.infer<typeof DATA_SCHEMA>;

// 3. Query function with error handling
export async function queryData(api: Api): Promise<Data[]> {
  const [queryError, query] = await tryAsync(
    api.query.pallet.storage.entries(),
  );

  if (queryError) {
    throw new Error(`Failed to query: ${queryError.message}`);
  }

  const [handlingError, result] = trySync(() =>
    handleMapValues(query, sb_some(DATA_SCHEMA)),
  );

  if (handlingError) {
    throw new Error(`Failed to parse: ${handlingError.message}`);
  }

  return result;
}
```

## Error Handling Strategy

All modules implement consistent error handling:

1. **Query Errors**: Network or API-level failures during blockchain queries
2. **Parse Errors**: Type validation failures when parsing substrate data
3. **Graceful Degradation**: Functions continue processing valid entries while
   collecting errors
4. **Detailed Messaging**: Clear error messages with context for debugging

### Result Type Pattern

Modules are transitioning to use Result types for better error handling:

We aim to have in the future only specific errors instead of allowing a generic error in the union like `E1 | E2 | Error` .

```ts
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";

// Query functions return Result with specific error types
export async function queryData(
  api: Api,
  id: string,
): Promise<Result<Data | null, ZError<Data> | Error>> {
  const [queryError, query] = await tryAsync(api.query.pallet.data(id));
  if (queryError) return makeErr(queryError);

  const parsed = DATA_SCHEMA.safeParse(query.toJSON());
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

// Usage with Result destructuring
const [error, data] = await queryData(api, "123");
if (error !== undefined) {
  console.error("Query failed:", error);
} else {
  console.log("Data:", data);
}
```

### Error Path Tracking

When using `safeParse`, include path information for better debugging:

```ts
const parsed = SCHEMA.safeParse(data, {
  path: ["storage", "pallet", "storageItem", String(key)],
});
```

## Development Guidelines

### Adding New Modules

1. **Create Schema**: Define Zod schemas for all pallet types
2. **Infer Types**: Use `z.infer<typeof SCHEMA>` for TypeScript types
3. **Query Functions**: Implement async query functions with error handling
4. **Utility Functions**: Add helper functions for common operations
5. **Documentation**: Document all exports with JSDoc comments

### Schema Evolution

When pallet types change:

1. **Update Schemas**: Modify Zod schemas to match new substrate types
2. **Type Safety**: TypeScript will catch breaking changes automatically
3. **Query Updates**: Update query functions if storage structure changes
4. **Backward Compatibility**: Consider migration strategies for existing data

### Testing Considerations

- **Schema Validation**: Test parsing with actual substrate data
- **Error Handling**: Verify graceful handling of malformed data
- **Query Functions**: Test against live or mocked blockchain state
- **Utility Functions**: Unit test business logic separately

## Current Limitations

### Schema Type Holes

Some schemas temporarily use `z.unknown()` where proper type definitions are pending:

- `CURATOR_SCOPE_SCHEMA.flags` - Should be `CURATOR_PERMISSIONS_SCHEMA` once fixed
- These are marked with `// TODO: fix z.unknown() holes` comments

### Migration Status

- **permission0.ts**: Fully migrated to Result type pattern with specific error types
- Other modules still use throw/catch pattern and need migration

## Dependencies

- **@polkadot/api**: Blockchain API interface
- **zod**: Schema validation and type inference
- **@torus-network/torus-utils**: Internal error handling utilities
