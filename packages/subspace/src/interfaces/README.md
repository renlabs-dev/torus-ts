# Subspace Types Generation

[polkadot.js.org/docs/api/examples/promise/typegen](https://polkadot.js.org/docs/api/examples/promise/typegen/)

## Types setup

We can specify additional type definitions by adding the following:

- `src/interfaces/definitions.ts` - this just exports all the sub-folder
  definitions in one go
- `src/interfaces/<module>/definitions.ts` - manual type definitions for a
  specific module
