# ClickFlow Agent Guide

## Scope and safety
- Keep Phase 1 and Phase 2 frontend work mock-first unless a task explicitly authorizes backend integration.
- Preserve public routes and existing behavior during structural refactors.
- Do not place secrets in source, fixtures, logs, or documentation.

## Architecture
- `apps/*` are deployable applications; `packages/*` must never import from apps.
- Put feature business UI, data access, schemas, and tests inside `apps/web/src/features/<feature>`.
- Keep `components/ui` for reusable primitives and `components/layout` for application chrome only.
- Route files compose feature entry points; they do not own business logic.

## Quality
- TypeScript stays strict. Validate user input with Zod.
- Add or update a focused test before behavior changes; run lint, typecheck, tests, build, and relevant Playwright tests before handoff.
- Update `docs/delivery/PROGRESS_CHECKLIST.md` when a phase acceptance criterion changes.