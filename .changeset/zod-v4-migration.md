---
"@torus-network/sdk": minor
"@torus-network/torus-utils": patch
"@torus-ts/api": patch
"@torus-ts/dsl": patch
---

This migration includes:

- Updated Zod to v4.1.5 across the monorepo
- Updated drizzle-zod to v0.8.3 for Zod v4 compatibility
- Fixed deprecated `.format()` and `.flatten()` API usage
- Updated Zod type definitions to use v4-compatible types:
  - Replaced `z.SafeParseReturnType` with `z.ZodSafeParseResult`
  - Updated `z.ZodSchema` type parameters for v4
  - Fixed enum schema creation using `z.nativeEnum()`
- Improved error handling by using `z.prettifyError()` for better formatted
  error messages

Breaking changes:

- Error formatting now uses `z.prettifyError()` instead of deprecated formatting
  methods
- Some internal type changes may affect advanced Zod usage patterns
