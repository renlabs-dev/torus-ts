# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Torus Network TypeScript monorepo built with Turborepo and pnpm. Contains web
applications, services, and shared packages for the Torus Network ecosystem.

### Architecture Components

- **Apps**: User-facing web applications
  - Allocator, Wallet, Bridge, Governance, Page
- **Services**: Backend services
  - cache, worker
- **Packages**: Shared libraries
  - SDK, UI components, utilities, API, database
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
# Push schema changes
just db-push

# Open database studio
just db-studio

# Export database dump
just db-dump
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

## Branching

- We should create new branches over `dev` branch
