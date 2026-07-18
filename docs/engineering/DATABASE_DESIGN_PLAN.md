# Database design — Backend Task 2

## Decisions

- PostgreSQL is the system of record and Prisma `6.19.1` is pinned for the current NestJS CommonJS runtime.
- UI `Space`, `Folder`, and `List` persist as `Workspace`, `Project`, and `Section`.
- `Document` is persisted. Dashboard, whiteboard, and form entries use `WorkspaceNavigationItem` metadata in the MVP.
- IDs are PostgreSQL UUIDs. API timestamps are stored as `timestamptz(3)` and serialized as ISO 8601 UTC.
- Business records carry `workspaceId` directly. Repository reads and mutations require `workspaceId` in the predicate.
- Status definitions use `TaskStatus(scopeType, scopeId)` so workspace, project, and section scopes share one stable contract.
- Comments alone use `deletedAt`; other MVP resources use `archivedAt` where restoration is supported.

## Referential and deletion policy

- Deleting a workspace cascades through workspace-owned business data.
- Deleting users is restricted while they own a workspace or authored retained records; memberships and sessions cascade.
- Deleting a project cascades through sections and project content. A parent project cannot be deleted while child projects exist.
- Task status deletion is restricted while tasks reference it. Assignee and optional section references become null when removed.
- Activity logs are system-written and cascade only with their workspace.

Cross-workspace relationships are rejected in application services and repositories. The first repository proof is
`WorkspaceTaskRepository`, whose read and update predicates both contain `{ id, workspaceId }`. The database integration
test creates two workspaces and proves that the second scope cannot read or rename the first workspace's task.

## Index strategy

The initial migration indexes workspace/project/section trees, task status and board order, assignee/due date, updated date,
time ranges, activity history, and archive filters. PostgreSQL full-text or trigram indexes are deferred until search has a
representative seed dataset and an `EXPLAIN ANALYZE` benchmark.

## Local migration and seed

Use a dedicated local PostgreSQL database and never point these commands at production:

```bash
pnpm --filter api prisma:migrate
SEED_USER_PASSWORD_HASH=<development-only-hash> pnpm --filter api prisma:seed
```

The seed uses fixed UUIDs and upserts, so repeated runs converge on the same user, workspace, project, section, status,
document, and task. The password hash must come from the environment; plaintext seed passwords are not accepted.

Run repository integration tests only against a disposable migrated database:

```bash
DATABASE_INTEGRATION_TESTS=1 DATABASE_URL=<dedicated-test-url> pnpm --filter api test:database
```

## Migration release and recovery

- Migrations are forward-only in shared environments and run as an explicit release step before the new application version.
- Before production migration, take and verify a PostgreSQL backup and review SQL for locks, destructive operations, and long index builds.
- Application releases remain compatible with schema N and N-1 during rollout. Rollback means reverting the application while retaining additive schema changes.
- A destructive schema correction requires a new compensating migration. Do not edit or roll back an already-applied migration in place.
- Restore is database backup recovery into a new instance, followed by migration status verification and smoke tests before traffic is switched.
