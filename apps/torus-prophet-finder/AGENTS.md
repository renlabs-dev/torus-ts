# Repository Guidelines

## Project Structure & Module Organization

- `src/app` — App Router (`page.tsx`, `layout.tsx`), global CSS in `src/app/globals.css`.
- `src/app/_components` — Reusable React components (e.g., `profile-card.tsx`, `hero/storm-hero.view.tsx`).
- `public` — Static assets (`textures/`, SVGs).
- Root config: `next.config.mjs`, `eslint.config.js`, `tsconfig.json`, `postcss.config.mjs`.
- TS alias: `~/*` → `src/*` (e.g., `import x from "~/app/_components/profile-card"`).

## Build & Dev Commands

- Use pnpm. Node 18.18+ or 20+.
- `pnpm dev` — Dev server (Turbopack) at http://localhost:3000.
- `pnpm build` — Production build. `pnpm start` — Serve build.
- `pnpm lint` — ESLint (Next + TS). Type-check: `pnpm exec tsc --noEmit`.

## LLM-Friendly Codebase Rules (Non‑negotiable)

- Small files, small functions: aim ≤150 lines per file, ≤30 lines per function; split aggressively. This structure is an invariant and may be relied upon for navigation.
- Precise names reflect content and scope. Examples:
  - Utilities: `src/lib/handles/normalize-handle.ts`
  - Components: `src/app/_components/profile-card.tsx`; if it grows, split to folder: `src/app/_components/profile-card/` with `profile-card.view.tsx`, `.types.ts`, `.model.ts`.
- Functional-first style: prefer pure functions and composition; React via function components and hooks; avoid classes and side effects in modules.
- Strict types only: no `any`, avoid unsafe casts; prefer unions, generics, and `satisfies`. Type errors must be zero.
- No dead code: remove unused exports/branches; keep only what’s used and tested.

## Coding Style & Naming

- TypeScript strict mode, no emit. Indentation: 2 spaces.
- Exports: default for pages/layouts; named exports for libraries/utilities.
- Imports: prefer the `~/*` alias over deep relatives.
- Styling: Tailwind v4 utilities in JSX; keep global CSS minimal and token-driven.

### Filenames (must follow kebab-case)

- All React components, hooks, and utilities in this app use kebab-case filenames (aka lower-dash-case).
  - Examples: `profile-card.tsx`, `storm-hero.view.tsx`, `use-tickers.ts`, `sample-prophets.ts`.
- Do not introduce PascalCase or camelCase filenames in this app.
- When renaming/adding files, update all imports to the kebab-case path.

### Shared UI components

- Buttons: always use the shared Button from `@torus-ts/ui/components/button`.
  - Import: `import { Button } from "@torus-ts/ui/components/button"`.
  - Do not use raw `<button>` elements unless there is a compelling, documented reason (e.g., inside third‑party primitives).

## Testing Guidelines

- No formal tests yet. If adding, prefer Vitest + React Testing Library.
- Name tests `*.test.ts(x)` near source (e.g., `src/components/ProfileCard.test.tsx`).
- Baseline: `pnpm lint` and type-check pass; critical UI states render without runtime errors.

## Commit & PR Guidelines

- Conventional Commits (e.g., `feat(hero): fade transition`, `fix(cards): prevent duplicate handle`).
- PRs: focused scope, clear description, steps to verify, linked issues, screenshots/video for UI.
- Require green `pnpm lint`, type-check, and `pnpm build` before review.

## Additional Context

This app is part of a monorepo. For overall monorepo structure, read `../../AGENTS.md`.
