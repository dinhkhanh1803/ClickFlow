# Cross-cutting platform and authorization

Task 3 provides shared backend behavior for every API vertical slice.

## Request lifecycle

- `RequestIdMiddleware` accepts a bounded `x-request-id` or creates a UUID, then returns it in the response.
- `RequestLoggingInterceptor` writes structured JSON with request ID, method, path, status and duration. Passwords, tokens, cookies, email addresses, phone numbers, IP addresses and API keys are redacted recursively.
- `QueryTimeoutInterceptor` stops requests after `QUERY_TIMEOUT_MS` (10 seconds by default).
- `HttpExceptionFilter` maps HTTP and Prisma failures to `{ code, message, details?, requestId }`. Unexpected errors are logged but their internal message is never returned.

## Workspace authorization

Controllers that access workspace-owned data must declare `@RequireWorkspaceAccess()`. The global `WorkspaceMembershipGuard` then:

1. requires an authenticated `request.user`;
2. resolves the workspace ID from route params, query or body;
3. verifies an active `WorkspaceMember` record;
4. exposes the trusted ID as `request.workspaceId`.

Use `@CurrentUser()` to read the authenticated principal and `withWorkspaceScope(request.workspaceId, input)` in repositories. The helper overwrites any untrusted `workspaceId` supplied by the caller, preventing cross-workspace reads and writes. Nested resources must still be queried through a parent relation constrained by this trusted workspace ID.

## Shared API controls

- Extend `PaginationQueryDto` and call `buildPagination()` with an explicit sort allowlist. Page size is capped at 100 and a deterministic ID tie-breaker is added.
- Mark retry-sensitive mutations with `@RequireIdempotencyKey()`. Clients must send a 16-128 character `Idempotency-Key` value.
- `/api/v1/metrics` reports request count, average latency, error rate, active requests and PostgreSQL connection usage.
- `/api/v1/health/live` checks the process; `/api/v1/health/ready` checks database readiness.

Authentication will populate `request.user` in Task 4. Until then, workspace-protected routes correctly return unauthorized instead of accepting caller-provided identity data.
