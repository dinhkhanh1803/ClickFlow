# Integration Task — Custom Status Workflow

## Rules

- Every new API Project starts with `Open`, `In progress`, and `Complete`.
- These three records are persisted with `isSystem=true` and cannot be deleted through the API.
- Users may add custom statuses, select a color, rename/recolor them, and delete them.
- Deleting a custom status moves tasks assigned to it to the system `Open` status before deletion.
- The same behavior is available in local fallback mode; local tasks return to `Open` (`Backlog` internally) when their custom status is removed.

## API contract

- Status responses expose `isSystem` so clients can disable destructive controls.
- `DELETE /api/v1/workspaces/{workspaceId}/projects/{projectId}/statuses/{statusId}` accepts an optional `replacementStatusId`.
- The API returns `409 Conflict` when a system status is targeted or when an in-use custom status has no valid replacement.

## Database

Migration `20260719223000_system_status_protection` adds `task_statuses.is_system` and marks existing default workflows as protected.

## Verification

- API service tests cover protected defaults and replacement of tasks when deleting a custom status.
- Web tests cover color selection, custom deletion, task fallback, default protection, rename, and recolor.
- API and web typechecks pass.
