# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, organised by feature folders: shared `components/`, page-level views in `pages/`, global state under `stores/`, hooks in `hooks/`, and static copy in `content/` and `locales/`. Contract artifacts sit in `abi/` and generated types in `@types/` (via `npm run type`). Vite serves assets from `public/`; production bundles land in `dist/`. The `cmd/` workspace holds TypeScript utilities for deployment (`web.ts`, `upload.ts`) and configuration (`config.json`).

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server on all interfaces for local previewing.
- `npm run build` performs a TypeScript project build then generates the production bundle.
- `npm run preview` serves the last build for smoke-testing the optimized output.
- `npm run lint` runs ESLint with the repo config; fix findings before committing.
- `npm run format` applies Prettier defaults (2-space indent, double quotes). Run after sweeping edits.
- `npm run type` regenerates typechain bindings after ABI updates.
- `npm run up` rebuilds and executes the deployment helper in `cmd/` (requires `cmd/config.json`).

## Coding Style & Naming Conventions
Stick to TypeScript, favor functional React components, and export a single default per file when practical. Name components with PascalCase, hooks with `use*`, and zustand/Redux stores with `*Store`. CSS lives in Tailwind-friendly classlists plus the scoped `.css` files already present. Avoid `any`; if unavoidable, document the reasoning inline.

## Testing Guidelines
Automated tests are not yet wired, so lean on `npm run lint`, type checks, and manual user flows. When adding coverage, prefer Vitest + React Testing Library, store specs in `src/__tests__/`, and name files `*.test.tsx`. Include realistic mock translations and ABI stubs when components depend on them.

## Commit & Pull Request Guidelines
Follow the existing imperative style (`修改：`, `优化：`) leading the message, keeping the subject under 60 characters. Group related changes and avoid bundling `cmd/` updates with UI tweaks without explanation. PRs need a short summary, testing notes (commands run), screenshots or GIFs for UI deltas, and links to associated issues or task IDs.

## Configuration & Secrets
Copy `cmd/config.example.json` to `cmd/config.json` for local runs; keep secrets out of version control. Update environment-specific RPC endpoints or keys via that file and document the change in the PR description.
