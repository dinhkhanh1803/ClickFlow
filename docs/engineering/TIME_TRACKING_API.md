# Timer and Time Entry API (Task 8)

Routes are scoped under `/api/v1/workspaces/:workspaceId` and timestamps are ISO 8601 UTC.

## Timers

- `POST /timers/start` requires `{ taskId, note? }` and an `Idempotency-Key` header of 16–128 safe characters.
- `POST /timers/stop` requires the same header and calculates `endedAt` plus positive `durationSeconds` on the server.
- `GET /timers/current` returns `{ timer: TimeEntry | null }` for the authenticated user in the current workspace.

Start and stop retries with the same key return the original entry. A new start key while any timer is running for that user returns `409`; a new stop key without a running timer returns `409`. The invariant is enforced with a transaction advisory lock and the PostgreSQL partial unique index `time_entries_one_running_per_user_key`.

## Manual entries

- `GET/POST /time-entries` lists or creates entries.
- `GET/PATCH/DELETE /time-entries/:entryId` reads, updates, or archives an owned entry.
- List filters include `taskId`, `projectId`, `from`, `to`, pagination, and archived state. Date ranges use half-open interval overlap semantics `[from, to)`.

Manual entries require `startedAt < endedAt`. Duration is calculated by the server. Active entries for one user may not overlap, including across workspaces; adjacent intervals are valid. New entries require an active task in the requested workspace. Running entries must be stopped through `/timers/stop` and cannot be edited or archived through manual-entry routes.

All timer/time-entry mutations and their task activity events commit in one transaction. Idempotency keys are stored only for retry correlation and are not returned by the API.
