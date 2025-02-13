# torus-ts

Monorepo for the **Torus Network** TypesSript Ecosystem. It's managed with
[Turborepo](https://turborepo.org) and [pnpm](https://pnpm.io/).

> [!IMPORTANT]  
> For a more in depth guide on how to use this project, please refer to the [Torus Docs](https://docs.torus.network/apps/intro).

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
  |─ torus-dao
  |   └─ DAO & Governance Portal
  |─ torus-page
  |   └─ Landing Page
  |─ torus-allocator
  |   └─ Set weights to Agents
  └─ torus-wallet
  |   └─ Transactions & Staking
services
  |─ torus-cache
  |   └─ Blockchain data caching service
  └─ torus-worker
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
  ├─ subspace
  |   └─ Substrate client library
  ├─ ui
  |   └─ UI components library
  ├─ utils
  |   └─ Common code
  └─ types
      └─ ==> TODO: migrate to `packages/utils` <==
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

## Get it running

```sh
# Install dependencies
pnpm install

# Configure environment variables
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# build the project (required for subspace package type system)
just build

# Push the Drizzle schema to the database (required for allocator and dao)
just db-push

# Run the project
just dev {{app-name}}
```
