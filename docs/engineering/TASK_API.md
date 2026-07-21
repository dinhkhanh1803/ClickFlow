# Task API (Task 6)

All routes are versioned under `/api/v1/workspaces/:workspaceId`. The workspace membership guard resolves the trusted workspace scope; repository queries never trust a workspace identifier from a request body.

## Routes

- `GET/POST /tasks` lists or creates tasks. List filters include `projectId`, `sectionId`, `statusId`, `assigneeId`, `from`, `to`, `archived`, and `search`.
- `GET/PATCH/DELETE /tasks/:taskId` reads, updates, or archives a task. `DELETE` receives `version` as a query parameter.
- `POST /tasks/:taskId/complete`, `/move`, and `/restore` complete, reposition, and restore a task.
- `GET/POST /tasks/:taskId/checklist-items` and `PATCH/DELETE /tasks/:taskId/checklist-items/:itemId` manage checklist items.
- `GET/POST /tags` lists or creates workspace tags.
- `POST /tasks/:taskId/tags` and `DELETE /tasks/:taskId/tags/:tagId` attach and detach tags idempotently/uniquely.

## Invariants

- `priority` is `URGENT | HIGH | NORMAL | LOW`; timestamps are ISO 8601 UTC.
- Project, status, section, assignee, parent task, tag, and checklist item are validated inside the trusted workspace scope.
- A parent must be in the same project. Self-parent, cycles, and hierarchy depth greater than five are rejected.
- Entering a completed status sets `completedAt`; leaving one clears it. Completing explicitly requires a completed status.
- Every task mutation carries the last observed positive `version`. A stale version returns `409` and no activity event is committed.
- Kanban move accepts at most one of `beforeTaskId` or `afterTaskId`. A PostgreSQL transaction advisory lock serializes writes to a project/status column; fractional ranks avoid rewriting the board, with controlled rebalance only when the rank gap becomes too small.
- Archived tasks are excluded from list, My Tasks, and Calendar-style date queries unless `archived=all|archived` is requested.
- Mutation and its `ActivityLog` record commit in one transaction.
