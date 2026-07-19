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
- [x] Cross-cutting authorization, observability, authentication, and rotating session lifecycle are implemented.
- [x] Workspace, member, project, project-status, and section APIs pass workspace-isolated HTTP/database tests.
- [x] Task core, Kanban ordering, subtask hierarchy, checklist, tags, optimistic concurrency, and workspace isolation are implemented and database-tested.
- [x] Comment CRUD and immutable task activity history are workspace-scoped, cursor-paginated, policy-protected, and database-tested.
- [x] Timer and manual time-entry APIs enforce one running timer per user, idempotent retry, UTC interval validation, overlap policy, and transactional activity.

- [x] Dashboard, workspace search, time/progress reports, performance baseline, contracts, and isolation acceptance tests are implemented.
- [x] Attachment signed-URL workflow, MIME/magic-byte validation, workspace namespace, orphan cleanup, ADR, and E2E tests are implemented.
- [x] Project templates, transactional idempotent instantiation, archive/restore, validated settings, migration, and rollback tests are implemented.
- [x] Backend hardening, PostgreSQL CI, scans, non-root container, Render staging blueprint, release/restore workflows, alert policy, smoke test, and runbooks are committed.

## Frontend–Backend Integration

- [x] Shared authentication contracts and a typed browser API client are implemented.
- [x] Login, session refresh, logout, forgot-password, and reset-password flows use the backend API.
- [x] Protected workspace routes require an authenticated backend session.
- [x] Workspace, project, and section navigation and CRUD use backend APIs.
- [x] Lists can be created directly under a Workspace or inside a Project without exposing the internal root container.
- [x] New API Projects default to Open, In progress, and Complete; extra statuses remain user-created.
- [x] Task screens load and mutate core Task fields through workspace-scoped backend APIs.
- [ ] Comments, activity, time tracking, reports, attachments, templates, and settings use backend APIs.
- [ ] End-to-end tests cover authenticated frontend workflows against PostgreSQL-backed APIs.
