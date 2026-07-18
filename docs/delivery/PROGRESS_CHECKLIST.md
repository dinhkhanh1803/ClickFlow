# Delivery Progress Checklist

## Phase 0 — Product Foundation

- [x] Product vision, MVP scope, user stories, business rules, information architecture, and user flows documented.
- [x] Monorepo, contribution, security, release, and quality standards established.
- [x] Architecture decision records and delivery roadmap created.

## Phase 1 — Frontend Foundation

- [x] Next.js, TypeScript, Tailwind, pnpm workspace, and Turborepo initialized.
- [x] Semantic light/dark tokens, typography, UI primitives, responsive shell, and accessibility baseline implemented.
- [x] Auth mock UI, dashboard mock data, typed contracts, route states, local UI state, and toast feedback implemented.
- [x] CI, lint, typecheck, unit tests, Playwright smoke/accessibility/visual checks, and build verification added.
- [x] Feature-first frontend boundaries, route groups, agent guidance, and architecture documentation established.

## Phase 2 — Frontend Features (entry criteria)

- [ ] Projects feature has local repository, schemas, queries, screens, and focused tests.
- [ ] Tasks feature supports create/edit/status/priority/deadline, list and Kanban views, with local persistence.
- [ ] Project details compose project health, task views, and mock activity.
- [ ] Calendar, time tracking, templates, archive, reports, and settings use the same local domain boundaries.
- [ ] All feature flows include loading, empty, error, and validation states.
- [ ] End-to-end tests cover core local workflows without a backend API.

## Phase 2 Definition of Done

- [ ] No backend endpoint or API client is required for core frontend flows.
- [ ] Local repository contracts are replaceable by future API implementations.
- [ ] New UI uses design tokens and shared primitives.
- [ ] Lint, typecheck, unit tests, build, accessibility, and visual checks pass.
- [ ] Documentation and this checklist reflect the delivered scope.
## Backend Phase 1 — API Foundation

Chi tiết triển khai theo frontend hiện tại: [Backend–FE alignment checklist](./BACKEND_FE_ALIGNMENT_CHECKLIST.md).

- [x] NestJS strict TypeScript application is wired into pnpm and Turborepo.
- [x] URI-versioned health/readiness endpoints and standard request ID error envelope are implemented.
- [x] Environment validation, CORS allowlist, security headers, validation, and graceful shutdown are enabled.
- [x] Swagger UI and deterministic committed OpenAPI JSON are available and checked in CI.
- [x] API lint, typecheck, unit tests, integration tests, and build pass.
- [x] Prisma/PostgreSQL schema, migration, seed, and workspace-isolated repositories are implemented.
