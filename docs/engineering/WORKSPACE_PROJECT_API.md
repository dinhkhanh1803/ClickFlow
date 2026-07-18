# Workspace and project API

Task 5 exposes the first workspace-owned resource slice. Every nested route requires a bearer access token and an active `WorkspaceMember` record. The authorized `workspaceId` written by the membership guard is used for all repository queries; caller-provided IDs are never trusted on their own.

## Routes

- `GET /api/v1/workspaces` lists active workspaces for the current user.
- `GET /api/v1/workspaces/:workspaceId` returns the current membership role and workspace summary.
- `GET /api/v1/workspaces/:workspaceId/members` returns member display summaries.
- `/api/v1/workspaces/:workspaceId/projects` supports create and paginated list.
- `/api/v1/workspaces/:workspaceId/projects/:projectId` supports read, partial update and archive.
- Nested `/statuses` and `/sections` routes support list, create, partial update, reorder and delete/archive.

Project list supports `page`, `pageSize` (maximum 100), `search`, `archived=active|archived|all`, allowlisted `sortBy` and deterministic `sortOrder` with an ID tie-breaker.

## Status contract

Public status categories remain the locked contract from `@clickflow/contracts`: `OPEN`, `IN_PROGRESS`, and `COMPLETED`. Prisma storage values are adapted internally:

| API | Prisma |
| --- | --- |
| `OPEN` | `NOT_STARTED` |
| `IN_PROGRESS` | `ACTIVE` |
| `COMPLETED` | `DONE` or legacy `CLOSED` |

Deleting a status used by tasks requires `replacementStatusId`. The replacement must be active and belong to the same workspace and project. Task reassignment, status deletion and activity creation occur in one transaction.

## Project health

Health is calculated from active tasks using these ordered rules:

1. `COMPLETED` when a non-empty project has every task completed.
2. `OVERDUE` when an incomplete project is past its project deadline.
3. `AT_RISK` when at least one incomplete task is past its due date.
4. `ON_TRACK` otherwise.

Progress is the rounded percentage of completed active tasks. A project without tasks has zero percent progress.

All project, status and section mutations write an `ActivityLog` in the same PostgreSQL transaction. Database E2E tests cover membership IDOR, cross-project section/status references, reorder completeness, replacement requirements, list filters and project archive behavior.
