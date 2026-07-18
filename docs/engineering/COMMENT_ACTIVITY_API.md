# Comment and Activity API (Task 7)

Routes are scoped under `/api/v1/workspaces/:workspaceId/tasks/:taskId` and protected by the workspace membership guard.

## Comments

- `GET /comments?cursor=&limit=` returns newest-first comments with an opaque UUID cursor and `nextCursor`.
- `POST /comments` creates a plain-text comment between 1 and 10,000 characters.
- `PATCH /comments/:commentId` updates content. Only the author can update it.
- `DELETE /comments/:commentId` soft-deletes content. The author or a workspace `OWNER` can delete it.

Deleted comments are excluded from reads and invalid as cursors. A cursor must belong to the same workspace, task, and active comment feed. Comment mutations and their task activity event commit in one transaction.

Archived tasks keep comments readable for historical context, but create, update, and delete return `404`.

## Activity

- `GET /activity?cursor=&limit=` returns newest-first system-written events for the task.
- There are no activity create, update, or delete endpoints. Client attempts return `404` and cannot modify audit records.
- Activity is readable after task archive.
- Metadata is limited to identifiers and operational fields written by backend services; comment events expose only `commentId`, never comment body snapshots.
