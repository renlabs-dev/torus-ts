# Prediction Swarm Dashboard

Next.js application for exploring and interacting with the Torus Prediction Swarm.

## Unusual Configuration Notes

### Dual Authentication System

This app uses **two separate authentication systems** that coexist:

1. **tRPC Authentication** - For authenticated tRPC endpoints (`prophet.addToMemory`, etc.)
   - Token stored in: `localStorage.authorization`
   - JWT signed with app's `JWT_SECRET`
   - Uses standard `@torus-ts/api/client` auth pattern with wallet signatures

2. **SwarmMemory REST Authentication** - For direct SwarmMemory API calls
   - Token stored in: `localStorage.torusDashboardSession`
   - JWT signed with SwarmMemory API's secret
   - Uses challenge/verify flow via `auth-store.ts`

Both systems use different localStorage keys and JWT secrets, so they don't conflict.

### Required Environment Variables

- **`POSTGRES_URL`** - Required even though this app doesn't use the database. The shared `@torus-ts/api` tRPC context requires it for other apps in the monorepo.

- **`TORUS_WALLET_SEED_PHRASE`** - Server wallet mnemonic used for SwarmMemory operations (creating tasks, etc.)

- **`NEXT_PUBLIC_API_BASE_URL`** - SwarmMemory API base URL. Must include `/api/` suffix for backward compatibility (the prophet router strips it before passing to SwarmMemory client).

See `.env.sample` for full configuration details.
