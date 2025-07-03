# Assistant Instructions

This file provides guidance to AI assistants when working with code in this
repository.

## Project Overview

Torus Network TypeScript monorepo built with Turborepo and pnpm. Contains web
applications, services, and shared packages for the Torus Network ecosystem.

### Architecture Components

- **Apps**: User-facing web applications
  - `torus-allocator`: Agent weight allocation interface  
  - `torus-wallet`: Token management and staking interface
  - `torus-bridge`: Cross-chain token bridge
  - `torus-governance`: DAO voting and proposals
  - `torus-portal`: Permission management and constraint creation
  - `torus-page`: Landing page
- **Services**: Backend services
  - `torus-cache`: Caching layer for blockchain data
  - `torus-worker`: Background processing and automation
- **Packages**: Shared libraries
  - `@torus-network/sdk`: Core Substrate/Polkadot.js integration
  - `@torus-ts/api`: tRPC API routes and database queries
  - `@torus-ts/db`: Drizzle ORM schema and database utilities
  - `@torus-ts/ui`: Shared React components and design system
  - `@torus-ts/dsl`: Domain-specific language for constraints
  - `@torus-network/torus-utils`: Utility functions and helpers
- **Tooling**: Development configuration
  - ESLint, Prettier, TypeScript, Tailwind

The SDK (`@torus-network/sdk`) is the core library for interacting with the
Torus Network blockchain, providing Substrate/Polkadot.js abstractions.

## Essential Commands

### Development Workflow

```sh
# Install dependencies
just install
# or: pnpm install

# Build everything
just build

# Setup database (required for Allocator and Governance apps)
just db-push

# Start development server for specific app
just dev torus-wallet
just dev torus-allocator
just dev torus-governance
just dev torus-bridge
just dev torus-page

# Watch mode development
just dev-watch torus-wallet
```

### Code Quality

```sh
# Run all checks (typecheck + lint)
just check-all

# Check specific package
just check "@torus-network/sdk"

# Fix formatting and linting
just fix

# Individual operations
just typecheck
just lint
just format
```

### Testing

```sh
# Test specific package
just test "@torus-network/torus-utils"
just test "torus-allocator"

# Test all packages
just test
```

### Database Operations

```sh
# Apply/push schema changes  
just db-push
# Alternative: just db-apply

# Open database studio
just db-studio

# Export database dump
just db-dump

# Generate migration files
# Note: Migrations are handled by Atlas and stored in atlas/migrations/
```

## Development Guidelines

### Package Targeting

When making changes, target specific packages for faster feedback:

- Format: `just format-fix "@torus-ts/utils"`
- Lint: `just lint-fix "@torus-ts/utils"`
- Test: `just test "@torus-network/torus-utils"`

### Error Handling Priorities

1. Typecheck errors must be addressed first
2. Fix linting errors in modified packages
3. Format errors only need fixing in modified packages
4. Ignore formatting/linting errors in unmodified packages

### Package Names

Key packages use different naming patterns:

- `@torus-network/sdk` - Main SDK package
- `@torus-network/torus-utils` - Utilities package
- `@torus-ts/*` - Internal workspace packages
- Apps use simple names: `torus-wallet`, `torus-allocator`, etc.

## Project Structure Insights

### Dependencies & Build Order

- Packages must build before apps (enforced by Turborepo)
- SDK requires subspace package for type generation
- Apps depend on shared packages (@torus-ts/ui, @torus-ts/api, etc.)

### Environment Setup

- Environment variables are shared across the monorepo
- Use `.env` file in root directory
- Database connection required for Allocator and Governance apps
- Multiple blockchain environment configurations supported

### Technology Stack

- **Frontend**: Next.js with React 19, Tailwind CSS, tRPC
- **Backend**: Node.js services, Drizzle ORM, PostgreSQL
- **Blockchain**: Polkadot.js API, custom Substrate integration
- **Development**: Turborepo, pnpm workspaces, Just task runner

## Documentation

### JSDoc Standards

Follow the project's [@docs/DOCUMENTATION_STYLE.md](./docs/DOCUMENTATION_STYLE.md) for all code documentation.

### Markdown

- Use `sh` instead of `bash` when sharing code block snippets.
- Use `ts` instead of `typescript` when sharing code block snippets.

## Database Architecture

### Schema Design

The database uses Drizzle ORM with PostgreSQL and follows these conventions:

- **Schema Location**: `packages/db/src/schema.ts` (main schema)
- **Migration System**: Atlas migrations in `atlas/migrations/`
- **Field Naming**: camelCase properties in TypeScript, snake_case columns in database
- **Primary Keys**: Use UUID for new tables, serial for legacy tables

### Key Tables

#### Core Agent System
- `agent`: Registered network participants
- `user_agent_weight`: User weight allocations  
- `computed_agent_weight`: Aggregated agent weights

#### Permission System (Updated Architecture - June 2025)
- `permissions`: Core permission data with Substrate permission_id (H256 hash)
- `permission_hierarchies`: Parent-child permission relationships without self-referential tables
- `emission_permissions`: Emission-specific permission data (allocation types, distribution control)
- `emission_stream_allocations`: Stream-based allocation data with percentage basis points
- `emission_distribution_targets`: Manual distribution targets with weights
- `permission_enforcement_controllers`: Enforcement authority accounts
- `permission_revocation_arbiters`: Revocation arbiter accounts
- `permission_revocation_votes`: Tracking of revocation votes
- `permission_enforcement_tracking`: Tracking of enforcement states
- `namespace_permissions`: Namespace-specific permission data
- `namespace_permission_paths`: Namespace paths for each permission
- `accumulated_stream_amounts`: Runtime state for stream accumulation

#### Governance System  
- `proposal`: Network governance proposals
- `whitelist_application`: Agent application requests
- `cadre`: Governance participants
- `comment`: Comments on proposals/applications

### Permission System Architecture Notes

**Key Design Decisions:**
- **No Self-Referential Tables**: Parent-child relationships use separate `permission_hierarchies` table
- **Substrate Integration**: All permissions have both internal UUID and Substrate H256 permission_id
- **Foreign Key Strategy**: Related tables reference `permission_id` (66-char varchar) not internal UUIDs
- **Normalized Structure**: Enforcement controllers, revocation arbiters stored in separate tables
- **Stream Support**: Full support for stream-based allocations with percentage basis points
- **Distribution Types**: Support for manual, automatic, at_block, and interval distributions

### Database Migration Guidelines

1. **Always use `IF EXISTS`** when dropping tables/types in migrations
2. **Increment storage version** when modifying existing table structures  
3. **Test migrations** on realistic data before applying to production
4. **Use Atlas** for migration generation and management
5. **Permission Updates**: When updating permission schema, ensure agent-fetcher transformation logic is updated

## Code Quality & Patterns

### Field Naming Convention

When working with database fields:
- **Schema properties**: Use camelCase (e.g., `grantorKey`, `permissionId`)
- **Database columns**: Use snake_case (e.g., `"grantor_key"`, `"permission_id"`)
- **SQL excluded references**: Use actual column names (e.g., `excluded.updated_at`)

### Common Patterns

```ts
// ✅ Correct: Use schema property names
const permission = await db.select().from(permissionsSchema).where(
  eq(permissionsSchema.grantorKey, address)
);

// ❌ Incorrect: Don't use snake_case property access
permission.grantor_key // This won't work with new schema

// ✅ Correct: Use camelCase property access  
permission.grantorKey // This works with Drizzle schema
```

### Substrate Integration

- **Permission IDs**: Always use the Substrate H256 hash (66 chars) for external APIs
- **Foreign Keys**: Reference `permission_id` (Substrate hash) not internal UUIDs
- **Account Addresses**: Use SS58 format, stored as varchar(256)

### Worker Services

#### Agent-Fetcher Worker

Location: `apps/torus-worker/src/workers/agent-fetcher.ts`

The agent-fetcher worker synchronizes blockchain data to the database:

- **Agents**: Syncs agent registrations, metadata, and whitelist status
- **Applications**: Syncs whitelist applications and proposal data
- **Permissions**: Transforms Substrate PermissionContract data to relational schema

**Permission Transformation Logic:**
- Maps Substrate permission structures to normalized database tables
- Handles emission permissions with streams and fixed amounts
- Processes distribution types (manual, automatic, timed)
- Extracts enforcement controllers and revocation arbiters
- Manages parent-child permission hierarchies
- Supports incremental updates with conflict resolution

**Key Functions:**
- `permissionContractToDatabase()`: Transforms Substrate data to database format
- `upsertPermissions()`: Batch inserts/updates permissions with proper foreign key handling
- `runPermissionsFetch()`: Main permission synchronization entry point

## Branching

- We should create new branches over `dev` branch
