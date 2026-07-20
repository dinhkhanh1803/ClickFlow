# ClickFlow Web

Next.js App Router frontend for ClickFlow. It reads `NEXT_PUBLIC_API_URL` from `apps/web/.env.local`; if unset, it defaults to `http://localhost:3001/api/v1`.

## Commands

- `pnpm dev` - starts the local app.
- `pnpm lint` - runs ESLint.
- `pnpm typecheck` - runs TypeScript validation.
- `pnpm test` - runs Vitest unit tests.
- `pnpm build` - creates the production build.
- `pnpm exec playwright test` - runs the browser smoke test.

## Run with the API

From the repository root, create `apps/web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`, start the API with `pnpm dev:api`, then start the web app with `pnpm dev`. Open `http://localhost:3000/dashboard`.