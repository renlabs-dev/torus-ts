# torus-ts

Monorepo for the **Torus Network** TypesSript Ecosystem. It's managed with
[Turborepo](https://turborepo.org) and [pnpm](https://pnpm.io/).

> [!IMPORTANT]  
> For a more in depth guide on how to use this project, please refer to the [Torus Docs](https://docs.torus.network/web-apps/intro/).

## Project Structure

```text
.github
  |─ workflows
  |   └─ CI with pnpm cache setup
  |─ ISSUE_TEMPLATE
  └─ DISCUSSION_TEMPLATE
.vscode
  └─ Recommended extensions and settings for VSCode users
apps
  |─ torus-governance
  |   └─ DAO & Governance Portal
  |─ torus-page
  |   └─ Landing Page
  |─ torus-allocator
  |   └─ Set weights to Agents
  |─ torus-wallet
  |   └─ Transactions & Staking
  |─ torus-bridge
  |   └─ Bridge between Base and Torus
  |─ torus-cache <!-- TODO: Move to services section -->
  |   └─ Blockchain data caching service
  └─ torus-worker <!-- TODO: Move to services section -->
      └─ Background services
packages
  ├─ api
  |   └─ tRPC v11 router definition
  ├─ db
  |   └─ Typesafe DB calls using Drizzle
  ├─ env-validation
  |   └─ Environment variables validation
  ├─ torus-provider
  |   └─ Polkadot JS API provider
  ├─ query-provider
  |   └─ React Query provider
  ├─ torus-sdk-ts
  |   └─ Main Torus Network SDK
  ├─ ui
  |   └─ UI components library
  └─ utils
      └─ Common code
tooling
  ├─ eslint
  |   └─ shared, fine-grained, eslint presets
  ├─ prettier
  |   └─ shared prettier configuration
  ├─ tailwind
  |   └─ shared tailwind configuration
  └─ typescript
      └─ shared tsconfig you can extend from
```

## Prerequisites

- **Node.js** - `20.16.0` or higher.
- **pnpm** - `9.7.1` or higher.
- **just** - `20.10.7` or higher, [installation guide](https://github.com/casey/just?tab=readme-ov-file#installation).
- **Text editor** - We recommend using [VSCode](https://code.visualstudio.com/).

## Get it running

```sh
# Install dependencies
pnpm install
# or
just install

# Configure environment variables
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# Build the project (required for SDK package type system)
just build

# Push the Drizzle schema to the database (required for allocator and governance)
just db-push

# Run the project
just dev {{app-name}}
```

## Chain Metadata & Type Generation

The SDK requires TypeScript types generated from blockchain metadata for each network environment.

### Generate Types

```sh
# For specific networks
just gen-types testnet
just gen-types mainnet
just gen-types local

# For custom endpoints
just gen-types "https://custom-node.example.com"
```

### Networks

- `mainnet` - `https://api.torus.network`
- `testnet` - `https://api.testnet.torus.network` 
- `local` - `http://localhost:9951`

### Process

1. Fetches metadata from network endpoint
2. Saves to `./data/metadata/{network}.json`
3. Generates TypeScript types in `packages/torus-sdk-ts/src/interfaces/`
4. Rebuild with `just build` after generating new types

### Generated Files

- `augment-api-consts.ts` - Blockchain constants
- `augment-api-errors.ts` - Runtime errors  
- `augment-api-events.ts` - Blockchain events
- `augment-api-query.ts` - Storage queries
- `augment-api-rpc.ts` - RPC calls
- `augment-api-runtime.ts` - Runtime API calls
- `augment-api-tx.ts` - Transaction types
- `augment-api.ts` - Main API augmentations
- `augment-types.ts` - Type augmentations
- `lookup.ts` - Type lookup registry
- `types.ts` - Core type definitions

Generated types provide full TypeScript support for blockchain interactions and must match the target network's runtime version.
