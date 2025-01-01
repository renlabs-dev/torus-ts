# torus-ts

Monorepo for the Torus Network TypesSript Ecosystem. It's managed with
[Turborepo](https://turborepo.org) and [pnpm](https://pnpm.io/).

```text
.github
  └─ workflows
        └─ CI with pnpm cache setup
.vscode
  └─ Recommended extensions and settings for VSCode users
apps
  |─ torus-cache
  |   └─ Blockchain data caching service
  |─ torus-governance
  |   └─ Governancel Portal
  |─ torus-page
  |   └─ Main / Landing Page
  |─ torus-validator
  |   └─ Community Validator Portal
  |─ torus-wallet
  |   └─ Wallet App
  └─ torus-worker
      └─ Background services
packages
  ├─ api
  |   └─ tRPC v11 router definition
  ├─ db
  |   └─ Typesafe DB calls using Drizzle
  ├─ providers
  |   └─ Substrate / React Query / toast provider library
  ├─ subspace
  |   └─ Substrate client library
  ├─ ui
  |   └─ UI components library
  ├─ utils
  |   └─ Common code
  ├─ wallet
  |   └─ UI components library
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

# Push the Drizzle schema to the database
pnpm db:push
```

## Docker

<!-- TODO: Docker README section -->

## Torus apps URLs

### torus-page

### torus-governance

### torus-allocator

### torus-worker

## References

This stack comes from [create-t3-app](https://github.com/t3-oss/create-t3-app).

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- Turbo
  - [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
  - [Caching](https://turbo.build/repo/docs/core-concepts/caching)
  - [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
  - [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
  - [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
  - [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
