# @torus-network/sdk

A TypeScript SDK for interacting with Torus Network.

## Installation

```bash
npm install @torus-network/sdk
# or
yarn add @torus-network/sdk
# or
pnpm add @torus-network/sdk
```

## Overview

This SDK provides a comprehensive set of tools and utilities to interact with the Torus Network blockchain. It includes modules for managing addresses, balances, staking, governance, and working with agent metadata.

## Features

- Connection setup with Torus nodes
- Address validation and handling
- Balance and staking operations
- Governance functions (proposals, voting, agent applications)
- Agent metadata fetching and validation
- EVM integration
- Type-safe interaction with the Torus blockchain

## Usage

### Connection Setup

```typescript
import { setup } from "@torus-network/sdk";

// Connect to a Torus node
const api = await setup("wss://your-torus-node-endpoint");
```

### Working with Modules

The SDK is organized into modules for different parts of the Torus ecosystem:

- Subspace module: handles balances, staking, agents, and emission
- Governance module: handles proposals, agent applications, and voting
- Address utilities: validation and type-safe address handling
- Agent metadata: fetching and validating agent information

### Examples

**Query Balance**

```typescript
import { queryFreeBalance } from "@torus-network/sdk";

const balance = await queryFreeBalance(api, "your-ss58-address");
console.log(`Current balance: ${balance}`);
```

**Query Agents**

```typescript
import { queryAgents } from "@torus-network/sdk";

const agents = await queryAgents(api);
console.log(`Found ${agents.size} agents`);
```

**Working with Governance**

```typescript
import { queryProposals } from "@torus-network/sdk";

const proposals = await queryProposals(api);
console.log(`Found ${proposals.length} proposals`);
```

## Important Notes

- This package must be built and imported indirectly to avoid typechecking conflicts in the generated/augmented types.
- The SDK uses Zod for runtime validation, ensuring type safety when interacting with the blockchain.

## Structure

- `/src/address.ts` - Address utilities
- `/src/agent_metadata/` - Agent metadata handling
- `/src/modules/` - Core modules (governance, subspace)
- `/src/types/` - Type definitions
- `/src/interfaces/` - Polkadot API interfaces and augments

## License

See the project license file for details.
