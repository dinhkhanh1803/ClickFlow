# Web Frontend Agent Guide

## File placement
- `src/app`: App Router route composition and route-group layouts only.
- `src/features/<name>`: feature components, queries, schemas, state, local repositories, and co-located tests.
- `src/components/ui`: framework-agnostic design-system primitives.
- `src/components/layout`: shell, header, sidebar, and providers shared by workspace routes.
- `src/lib`: cross-feature utilities and infrastructure only.
- `src/stores`: app-wide UI state only; feature state belongs to its feature.

## Frontend rules
- Use typed contracts from `@clickflow/contracts`; do not duplicate domain types in UI files.
- Use React Hook Form plus Zod for user-entered data.
- Use TanStack Query through feature query modules, not directly in route files.
- Keep mock/local repository interfaces compatible with a future API-backed implementation.
- Use semantic design tokens and existing UI primitives; do not introduce one-off colors or spacing without a documented token.

## Verification
Run before a handoff:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter web exec playwright test
```