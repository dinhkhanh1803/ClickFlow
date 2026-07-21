# Frontend Architecture

## Goal

ClickFlow uses a feature-first frontend so Phase 2 can add local product workflows without coupling them to routes or a backend API.

## Boundaries

```text
src/
  app/                 route composition and route-group layouts
  components/
    layout/            workspace chrome and global providers
    ui/                reusable primitives
  features/
    auth/              auth forms and validation
    dashboard/         dashboard views and typed query adapters
  lib/                 cross-feature infrastructure
  stores/              global UI state
  test/                shared test setup
```

Each future feature uses this internal layout when needed:

```text
features/projects/
  components/
  data/                local repository and query adapters
  schemas/
  state/
  projects.test.tsx
```

## Data flow

Route file → feature entry component → feature query → repository interface → local mock/persistence implementation.

UI code reads domain types from `@clickflow/contracts`. Routes never call a repository directly. This preserves the UI when a future API repository replaces the local one.

## Dependencies

- Features may import `components/ui`, `components/layout`, `lib`, `stores`, and `@clickflow/contracts`.
- Shared folders must not import a feature.
- Packages must not import applications.
- Feature-to-feature imports should use a small public entry point; shared domain code belongs in `packages/contracts` or `src/lib`.

## Testing

Keep tests co-located with the component or module they validate. `src/test` contains only shared Vitest setup. Browser tests remain in `e2e` because they validate routes and complete flows.