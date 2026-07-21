# Integration Task 4 ? Comments and Activity History

## Completed

- Added an authenticated frontend client for task comments and activity.
- Loaded the latest 100 comments and activity events for every API-backed task.
- Mapped comment author summaries and timestamps into the existing task detail panel.
- Displayed backend-written activity events in the same chronological activity feed.
- Connected the comment composer to POST /workspaces/:workspaceId/tasks/:taskId/comments.
- Invalidated both comment and activity queries after a successful post.
- Kept mock/local behavior unchanged when the user is not using an authenticated API session.

## API routes used

- GET /workspaces/:workspaceId/tasks/:taskId/comments?limit=100
- POST /workspaces/:workspaceId/tasks/:taskId/comments
- PATCH /workspaces/:workspaceId/tasks/:taskId/comments/:commentId
- DELETE /workspaces/:workspaceId/tasks/:taskId/comments/:commentId
- GET /workspaces/:workspaceId/tasks/:taskId/activity?limit=100

## Review checklist

- Open an API-backed Task and confirm existing comments appear in Activity.
- Submit a text comment and confirm it appears after the request completes.
- Confirm Task activity events are read-only and ordered by timestamp.
- Confirm switching Workspace never reuses comments from another Workspace.

## Deferred

