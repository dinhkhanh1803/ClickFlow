# Integration Task 6 ? Dashboard, Search and Reports

## Delivered

- Dashboard metrics and project health now load from the workspace-scoped analytics API.
- Global search queries persisted Projects and Tasks through the backend search endpoint.
- Reports show the last 30 days of time and task progress from backend aggregates.
- All requests use the authenticated API client and React Query cache keys scoped by Workspace.

## Manual review

1. Open the dashboard and compare active project/task metrics with seeded data.
2. Press Ctrl+K, enter at least two characters, and open a Project or Task result.
3. Open Reports and verify tracked time, completion rate, and per-project rows.
