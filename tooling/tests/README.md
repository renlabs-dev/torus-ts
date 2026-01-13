# @torus-ts/vitest-config

Shared Vitest test configuration and setup for the Torus monorepo.

## Structure

- `setup.ts` - Global test setup with common mocks for Zustand, wagmi, Hyperlane, and Testing Library matchers

## Usage

### In your app/package

1. Create a `vitest.config.mts` file:

```ts
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

2. Create a `src/test/setup.ts` file that imports the shared setup:

```ts
/**
 * App-specific test setup
 */
import "@torus-ts/vitest-config/setup";

// Add app-specific mocks here if needed
```

3. Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

4. Add dev dependencies:

```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.0",
    "vite": "^5.0.0",
    "vite-tsconfig-paths": "^4.2.0",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

## What's Included

The shared setup (`setup.ts`) provides:

- **Test Library Setup**: Automatic cleanup after each test
- **Jest-DOM Matchers**: `toBeDisabled`, `toBeInTheDocument`, etc.
- **Common Mocks**:
  - `zustand`: State management library
  - `@wagmi/core`: Wallet connection
  - `@hyperlane-xyz/sdk`: Cross-chain messaging

## Adding Project-Specific Mocks

Projects can add their own mocks in their local `src/test/setup.ts`:

```ts
import "@torus-ts/vitest-config/setup";
import { vi } from "vitest";

// Add project-specific mocks
vi.mock("@my-lib/specific", () => ({
  myFunction: vi.fn(),
}));
```

## Examples

See `apps/torus-bridge/` for a complete example of Vitest setup in a Next.js app.
