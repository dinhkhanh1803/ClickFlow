# Integration Task 8 ? Templates, Archive and Workspace Settings

## Delivered

- Templates can be listed, created from active Projects, instantiated with idempotency keys, and archived.
- Archive groups persisted Projects, Tasks, and Templates and restores each resource through its typed endpoint.
- Workspace settings load and save timezone, locale, week start, and notification preferences.
- Mutations invalidate their scoped React Query caches and show user feedback.

## Manual review

1. Create a template from a populated Project, use it, then archive it.
2. Open Archive and restore an archived Project, Task, or Template.
3. Change timezone, locale, week start, and notifications; reload and verify persistence.
