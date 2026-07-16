# ClickFlow Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested, mock-data-only ClickFlow frontend foundation with a light-first design system and responsive application shell.

**Architecture:** `apps/web` is a Next.js App Router application. Shared domain types are exported from `packages/contracts`; route groups isolate authenticated shell pages from mock auth pages. CI runs repository scripts through Turborepo.

**Tech Stack:** pnpm, Turborepo, Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, Vitest, Testing Library, Playwright.

---

### Task 1: Create the web application and workspace tooling

**Files:** `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/app/layout.tsx`, root `package.json`, `turbo.json`.

- [ ] Create the web app through `pnpm create next-app` with TypeScript, App Router, Tailwind and `src/` disabled; do not enable a backend.
- [ ] Define root scripts `dev`, `build`, `lint`, `typecheck`, `test` as Turbo tasks and add only required workspace dev dependencies.
- [ ] Run `pnpm install`, `pnpm --filter @clickflow/web build`, and verify the default app builds.

### Task 2: Establish design system and accessibility baseline

**Files:** `apps/web/app/globals.css`, `apps/web/components/theme-provider.tsx`, `apps/web/components/ui/*`, `apps/web/lib/utils.ts`.

- [ ] Add semantic CSS variables for light/dark palettes including primary `#6366F1`, secondary `#7B68EE`, tertiary `#B95F00`, focus ring and destructive states.
- [ ] Add Hanken Grotesk, Inter and JetBrains Mono via `next/font`; ensure body and headings use their semantic classes.
- [ ] Configure shadcn primitives and theme provider. Verify keyboard focus is visible with `focus-visible:ring`.

### Task 3: Add contracts, mock data and test harness

**Files:** `packages/contracts/src/index.ts`, `apps/web/lib/mock-data.ts`, `apps/web/vitest.config.ts`, `apps/web/test/setup.ts`, `apps/web/components/app-sidebar.test.tsx`.

- [ ] Write a failing test asserting sidebar renders Dashboard and Create New.
- [ ] Define exported `NavigationItem`, `ProjectSummary`, `TaskSummary`, `DashboardMetric` types and deterministic mock data.
- [ ] Implement the sidebar then run `pnpm --filter @clickflow/web test` until the test passes.

### Task 4: Build responsive application shell and route shells

**Files:** `apps/web/app/(app)/layout.tsx`, `apps/web/components/app-sidebar.tsx`, `apps/web/components/app-header.tsx`, `apps/web/components/page-state.tsx`, `apps/web/app/(app)/**/page.tsx`.

- [ ] Implement desktop sidebar and mobile drawer with semantic navigation and active route indication.
- [ ] Implement header with workspace label, non-networked search, notification control and avatar menu trigger.
- [ ] Add all requested routes with page title, mock content and loading/empty/error state variants.
- [ ] Run lint, typecheck and component tests.

### Task 5: Implement dashboard and authentication mock flows

**Files:** `apps/web/app/(app)/dashboard/page.tsx`, `apps/web/components/dashboard/*`, `apps/web/app/(auth)/**/page.tsx`, `apps/web/components/auth/*`.

- [ ] Write tests for metric card and mock login validation.
- [ ] Build dashboard metrics, today task list, weekly hours visualization, deadline list and project health cards from mock data.
- [ ] Build login, forgot-password and reset-password forms using React Hook Form and Zod; submit only changes local success state.
- [ ] Run relevant tests and check keyboard form traversal.

### Task 6: Add quality automation and browser smoke coverage

**Files:** `.github/workflows/ci.yml`, `apps/web/playwright.config.ts`, `apps/web/e2e/smoke.spec.ts`, `README.md`.

- [ ] Add CI workflow running install, lint, typecheck, test and build without deployment.
- [ ] Add Playwright smoke test asserting login and dashboard routes load.
- [ ] Update README with real commands and Phase 1 state.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and Playwright smoke test; inspect `git diff --check`.
