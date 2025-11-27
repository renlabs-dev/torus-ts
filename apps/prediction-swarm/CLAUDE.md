# Prediction Swarm - Assistant Instructions

## Application Overview

Prediction Swarm is a decentralized prediction market platform built on the Torus Network. It aggregates and displays predictions from multiple sources (prophets), tracks prediction accuracy, and provides analytics on predictor performance across various financial tickers.

**Core Concept**: "From cells to societies, intelligence emerges through nested agency. The swarm applies this principle to predictions, mapping who to trust and when, turning uncertainty into clarity."

### Technology Stack

- **Framework**: Next.js 15 with React 19, App Router
- **Styling**: Tailwind CSS
- **Data Fetching**: tRPC with TanStack Query
- **3D Graphics**: React Three Fiber, Three.js, Postprocessing
- **State Management**: Zustand
- **Blockchain**: Torus Network (Substrate/Polkadot.js)
- **Database**: PostgreSQL (shared with monorepo)
- **External APIs**: CoinGecko, Twitter API

### Key Features

1. **Prophets (Top Predictors)**: Leaderboard of most accurate predictors
2. **Tickers**: Live predictions across cryptocurrency tickers
3. **User Profiles**: Individual predictor performance analytics
4. **Prediction Feed**: Real-time activity stream from all predictors
5. **Scraper Queue**: Background job monitoring for data collection
6. **Search**: Global search for prophets and tickers

## Development Setup

### Prerequisites

- PostgreSQL database running (shared with monorepo)
- Torus Network RPC endpoint access
- API keys for CoinGecko and Twitter API

### Environment Variables

Required environment variables (add to root `.env`):

```sh
# Blockchain Connection
NEXT_PUBLIC_TORUS_RPC_URL="wss://api.testnet.torus.network"
NEXT_PUBLIC_TORUS_CACHE_URL="https://cache.testnet.torus.network"
NEXT_PUBLIC_TORUS_CHAIN_ENV="testnet"  # or "mainnet"

# Application Addresses
NEXT_PUBLIC_PREDICTION_APP_ADDRESS="<SS58_ADDRESS>"
PREDICTION_APP_ADDRESS="<SS58_ADDRESS>"  # Server-side
NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS="<SS58_ADDRESS>"

# Database (shared with monorepo)
POSTGRES_URL="postgresql://user:password@host:port/database"

# Authentication
JWT_SECRET="<your-secret>"
NEXT_PUBLIC_AUTH_ORIGIN="validator.torus.network"

# External APIs
COINGECKO_API_KEY="<your-key>"  # Optional
TWITTERAPI_IO_KEY="<your-key>"

# Application Config
BASE_URL="https://predictionswarm.com"  # Production
# BASE_URL="https://localhost:3004"  # Development
```

### Essential Commands

```sh
# Start development server (port 3004)
just dev prediction-swarm

# Build for production
just build prediction-swarm

# Type checking
just typecheck prediction-swarm

# Linting
just lint prediction-swarm
just lint-fix prediction-swarm

# Formatting
just format prediction-swarm
just format-fix prediction-swarm
```

### Direct npm Scripts

```sh
cd apps/prediction-swarm

# Development
pnpm dev                    # Start dev server on port 3004

# Building
pnpm build                  # Build with Turbopack
pnpm build:turbo            # Build via Turborepo

# Code Quality
pnpm typecheck              # TypeScript validation
pnpm lint                   # ESLint check
pnpm lint-fix               # Fix linting issues
pnpm format                 # Check formatting
pnpm format-fix             # Fix formatting
```

## Project Structure

```
src/
├── app/
│   ├── (pages)/                    # Page routes
│   │   ├── (expanded-pages)/       # Full-screen pages
│   │   │   ├── top-predictors/     # Prophets leaderboard
│   │   │   ├── tickers/            # All tickers overview
│   │   │   ├── ticker/[slug]/      # Individual ticker details
│   │   │   ├── user/[slug]/        # User profile pages
│   │   │   ├── feed/               # Prediction activity feed
│   │   │   └── scraper-queue/      # Admin queue monitoring
│   │   ├── layout.tsx              # Root layout with providers
│   │   └── page.tsx                # Landing page
│   ├── _components/                # Shared components
│   │   ├── user-profile/           # Profile components
│   │   ├── main-page/              # Landing page components
│   │   └── scraper-queue/          # Queue monitoring UI
│   ├── api/
│   │   └── trpc/[trpc]/route.ts    # tRPC API handler
│   └── globals.css                 # Global styles
├── trpc/
│   ├── react.tsx                   # Client-side tRPC setup
│   └── server.ts                   # Server-side tRPC setup
├── store/
│   └── search-store.ts             # Zustand search state
└── env.ts                          # Environment validation

public/
├── background.svg                  # Page backgrounds
└── og.svg                          # Open Graph image
```

## Architecture & Patterns

### Data Flow

1. **Client Components** use tRPC hooks from `~/trpc/react`
2. **tRPC Routes** defined in `@torus-ts/api` package
3. **Database** accessed via Drizzle ORM in `@torus-ts/db`
4. **Blockchain** data fetched via `@torus-network/sdk`
5. **Caching** layer at `NEXT_PUBLIC_TORUS_CACHE_URL`

### Authentication

Uses Substrate account signature-based authentication:

1. User signs authentication message with Polkadot.js wallet
2. JWT token generated and stored in localStorage
3. Token sent with all tRPC requests via custom auth link
4. Server validates signature using `@torus-ts/api/client`

### 3D Graphics

The landing page features a custom dithering effect using React Three Fiber:

```tsx
<Dither
  pixelSize={1}
  waveSpeed={0.02}
  waveFrequency={4}
  waveAmplitude={0.3}
  mouseRadius={0.2}
/>
```

### Shared Packages

- `@torus-ts/api`: tRPC routes and database queries
- `@torus-ts/db`: Drizzle ORM schema
- `@torus-ts/ui`: Shared React components
- `@torus-ts/torus-provider`: Blockchain connection provider
- `@torus-ts/query-provider`: TanStack Query setup
- `@torus-ts/env-validation`: Environment variable validation
- `@torus-network/sdk`: Torus Network SDK
- `@torus-network/torus-utils`: Utility functions

## Database Schema

Prediction Swarm uses these key tables from `@torus-ts/db`:

### Prediction Tables

- **predictions**: Individual prediction records
- **prediction_verdicts**: Resolved prediction outcomes
- **prediction_accounts**: Predictor accounts and metadata
- **prediction_tickers**: Asset tickers being predicted

### Memory System (New)

The app is transitioning to use a memory-based system for storing predictions:

- **memory**: Core memory records with vector embeddings
- **memory_messages**: Chat-style message history
- **memory_accounts**: Account metadata for memory system

See `/packages/db/src/schema/memory.ts` for the latest schema.

### Query Patterns

Most queries use tRPC procedures defined in `@torus-ts/api/router/prediction`:

```ts
// Example: Fetch top predictors
const { data } = api.prediction.getTopPredictors.useQuery({
  limit: 50,
  timeframe: "30d",
});

// Example: Fetch ticker predictions
const { data } = api.prediction.getTickerPredictions.useQuery({
  tickerSlug: "BTC",
});
```

## Development Guidelines

### Adding New Pages

1. Create page in `src/app/(pages)/(expanded-pages)/[name]/page.tsx`
2. Add route to navigation in `src/app/_components/navigation-items.tsx`
3. Add to search index in `src/app/_components/search-command.tsx`
4. Update sitemap/metadata as needed

### Working with tRPC

```ts
// Client-side usage
import { api } from "~/trpc/react";

function MyComponent() {
  const { data, isLoading } = api.myRouter.myProcedure.useQuery({
    /* params */
  });

  const mutation = api.myRouter.myMutation.useMutation();

  return (
    /* JSX */
  );
}
```

### Environment Variables

- Client-side vars MUST be prefixed with `NEXT_PUBLIC_`
- Add all new vars to `src/env.ts` schema
- Add to Turbo config at `turbo.json` for proper caching
- Add to Helm values for deployment

### Performance Considerations

- Images are optimized via Next.js Image component
- Remote image sources configured in `next.config.mjs`
- TanStack Query caching with 30s stale time
- Batch tRPC requests via `httpBatchLink`

### Styling Patterns

- Use Tailwind CSS utility classes
- Shared components from `@torus-ts/ui`
- Responsive design with mobile-first approach
- Dark mode support via Tailwind
- Custom animations via `tailwindcss-animate`

## Deployment

### Helm Configuration

Deployed via Helmfile to Kubernetes:

```sh
# Deploy to staging
helmfile -e dev apply

# Deploy to production
helmfile -e prod apply
```

### Environments

- **Staging**: `staging.predictionswarm.com`
  - Testnet blockchain
  - Development database
- **Production**: `predictionswarm.com`
  - Mainnet blockchain
  - Production database

### Build Process

1. Dependencies installed via pnpm
2. TypeScript compiled
3. Next.js build with Turbopack
4. Docker image created
5. Deployed to Kubernetes via Helm

## External Integrations

### CoinGecko API

Used for cryptocurrency ticker data and pricing:

- Price feeds
- Market cap data
- Ticker metadata

### Twitter API

Used for social media integration:

- Predictor profile information
- Tweet embedding
- Social metrics

### Torus Cache

Caching layer for blockchain data:

- Block data
- Transaction history
- Agent metadata
- Permission data

## Troubleshooting

### Common Issues

**Database Connection Errors**:

- Verify `POSTGRES_URL` is correct
- Ensure database migrations are up to date: `just db-push`
- Check database is accessible from your network

**Blockchain Connection Errors**:

- Verify `NEXT_PUBLIC_TORUS_RPC_URL` is accessible
- Check chain environment matches RPC endpoint
- Try switching to alternative RPC endpoint

**Build Errors**:

- Clear Next.js cache: `rm -rf .next`
- Clear Turbo cache: `rm -rf .turbo`
- Rebuild dependencies: `pnpm install --force`

**Type Errors**:

- Ensure shared packages are built: `just build "@torus-ts/api"`
- Regenerate types from SDK: `just build "@torus-network/sdk"`

### Port Already in Use

Default port is 3004. If blocked:

```sh
# Find process using port
lsof -i :3004

# Kill the process
kill -9 <PID>

# Or change port in package.json dev script
```

## Related Documentation

- [Main Project README](../../CLAUDE.md)
- [Documentation Style Guide](../../docs/DOCUMENTATION_STYLE.md)
- [Database Schema](../../packages/db/README.md)
- [tRPC API](../../packages/api/README.md)
- [Torus SDK](../../packages/sdk/README.md)
