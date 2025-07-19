# ESM Module Resolution Configuration

This document explains the ESM (ECMAScript Modules) import resolution setup for the Torus TypeScript monorepo, including the configuration changes needed to fix Next.js development issues with `.js` file extensions.

## Background

### The Problem

When using TypeScript with `moduleResolution: "NodeNext"` and ESM imports, TypeScript requires explicit `.js` file extensions in import statements, even when importing from `.ts` files. This is because the compiled JavaScript output will use `.js` extensions.

```ts
// Required for ESM compatibility
import { trySync } from "./try-catch.js";  // ✅ Correct
import { trySync } from "./try-catch";     // ❌ Error in ESM mode
```

However, Next.js in development mode had trouble resolving these `.js` imports when the actual files were `.ts` files in the source directory.

### The Solution

We implemented a **pre-build approach** where publishable packages are compiled to JavaScript before being consumed by Next.js applications.

## Technical Implementation

### 1. Package.json Exports Configuration

Updated package exports to point to compiled `dist/` files instead of source `src/` files:

#### Before (Problematic)

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./typing": "./src/typing.ts"
  }
}
```

#### After (Fixed)

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./typing": {
      "types": "./dist/typing.d.ts", 
      "default": "./dist/typing.js"
    }
  }
}
```

### 2. TypeScript Import Conventions

All relative imports in TypeScript files use `.js` extensions:

```ts
// ✅ Correct ESM imports
import type { Result } from "./result.js";
import { trySync } from "./try-catch.js";
export * from "./typing.js";

// ❌ Avoid - not ESM compatible
import type { Result } from "./result";
import { trySync } from "./try-catch";
```

### 3. Next.js Configuration

Removed packages from `transpilePackages` since they're now pre-built:

```js
// next.config.mjs
const config = {
  transpilePackages: [
    "@torus-ts/api",           // Still transpiled (not pre-built)
    "@torus-ts/db",            // Still transpiled (not pre-built)
    "@torus-ts/ui",            // Still transpiled (not pre-built)
    "@torus-ts/env-validation", // Still transpiled (not pre-built)
    // Removed: "@torus-network/torus-utils" - now pre-built
    // Removed: "@torus-network/sdk" - now pre-built
  ],
};
```

### Automated Builds

The turbo build system ensures packages build in the correct order based on dependencies.

## Package Categories

### Pre-built Packages (Use dist/)

- `@torus-network/torus-utils` - Must be built before development
- `@torus-network/sdk` - Must be built before development

### Transpiled Packages (Use src/)

- `@torus-ts/api` - Transpiled by Next.js during development
- `@torus-ts/db` - Transpiled by Next.js during development  
- `@torus-ts/ui` - Transpiled by Next.js during development
- `@torus-ts/env-validation` - Transpiled by Next.js during development

## Troubleshooting

### Module Not Found Errors

If you see errors like:

```txt
Module not found: Can't resolve './typing.js'
```

**Solution**: Build the affected package:

```sh
cd packages/torus-utils && pnpm run build
# or
cd packages/torus-sdk-ts && pnpm run build
```

### Import Extension Errors

If TypeScript shows:

```txt
Relative import paths need explicit file extensions in ECMAScript imports
```

**Solution**: Add `.js` extension to the import:

```ts
// Fix this
import { helper } from "./helper";

// To this  
import { helper } from "./helper.js";
```

### Next.js Development Issues

If Next.js can't resolve imports after adding `.js` extensions:

1. **Check package.json exports** - Ensure they point to `dist/` files
2. **Build the package** - Run `pnpm run build` in the package directory
3. **Remove from transpilePackages** - Don't transpile pre-built packages

## Best Practices

### When to Use .js Extensions

- ✅ **Always use** `.js` extensions for relative imports within packages
- ✅ **Use** `.js` extensions for internal package imports
- ❌ **Don't use** extensions for external package imports

```ts
// ✅ Relative imports - use .js
import { helper } from "./utils/helper.js";
import type { Config } from "../types/config.js";

// ✅ External packages - no extension needed
import { z } from "zod";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
```

### Package Development

When developing publishable packages:

1. **Use .js extensions** in all relative imports
2. **Configure exports** to point to `dist/` files
3. **Build before testing** with Next.js applications
4. **Include both .js and .d.ts** files in exports

### Adding New Packages

When creating new publishable packages:

1. **Copy exports pattern** from existing packages
2. **Use external-package.json** TypeScript config
3. **Add build script** with `tsc`
4. **Test import resolution** with a Next.js app

## Future Considerations

### Node.js Native ESM

As Node.js ESM support continues to mature, this configuration provides forward compatibility with:

- Native ESM module resolution
- Bundler-free development workflows  
- Standard package distribution formats

### Build Optimization

Consider adding:

- **Watch mode builds** for package development
- **Incremental compilation** for faster rebuilds
- **Build caching** strategies for CI/CD
