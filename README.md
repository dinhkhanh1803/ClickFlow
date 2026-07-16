# ClickFlow

ClickFlow is a mock-first product-management workspace for freelancers and small teams. Phase 1 establishes a production-quality frontend foundation without a backend API.

## Phase 1 status

The frontend foundation includes:

- Next.js, TypeScript, Tailwind CSS, pnpm workspaces, and Turborepo.
- Light/dark semantic design tokens, Hanken Grotesk, Inter, and JetBrains Mono.
- Responsive app shell with active navigation, mobile drawer, header controls, account menu, and global toast feedback.
- Typed mock contracts and dashboard widgets for metrics, tasks, weekly hours, deadlines, and project health.
- Mock authentication UI: sign-in, password recovery, and password reset flows with React Hook Form and Zod validation.
- Quality gates: ESLint, strict TypeScript, Vitest, Playwright smoke tests, axe accessibility checks, visual regression baselines, and GitHub Actions CI.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/dashboard`.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter web exec playwright test
```

## Scope boundary

Phase 1 intentionally uses deterministic frontend mock data only. Authentication, persistence, API integration, real search, and business workflows start in Phase 2 and later.