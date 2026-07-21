# ClickFlow Backend API

Base URL local: `http://localhost:3001/api/v1`.

- Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI artifact: [`openapi.json`](./openapi.json)
- Authentication: `Authorization: Bearer <access-token>`
- Workspace endpoints luôn kiểm tra membership từ `workspaceId` trong URL.
- Mutation có retry semantics yêu cầu `Idempotency-Key` theo mô tả từng feature.
- Timestamp dùng ISO 8601 UTC; lỗi dùng envelope `{ code, message, details?, requestId }`.

## Feature guides

- Task 5 — Workspace/project: [`WORKSPACE_PROJECT_API.md`](../engineering/WORKSPACE_PROJECT_API.md)
- Task 6 — Tasks: [`TASK_API.md`](../engineering/TASK_API.md)
- Task 7 — Comments/activity: [`COMMENT_ACTIVITY_API.md`](../engineering/COMMENT_ACTIVITY_API.md)
- Task 8 — Timer/time entries: [`TIME_TRACKING_API.md`](../engineering/TIME_TRACKING_API.md)
- Task 9 — Dashboard/search/reports: [`ANALYTICS_API.md`](./ANALYTICS_API.md)
- Document workflow: [`DOCUMENT_API.md`](../engineering/DOCUMENT_API.md)
- Task 10 — Attachments: [`ATTACHMENT_API.md`](./ATTACHMENT_API.md)
- Task 11 — Templates/archive/settings: [`PRODUCTIVITY_API.md`](./PRODUCTIVITY_API.md)
- Task 12 — Health/metrics/operations: [`OPERATIONS_API.md`](./OPERATIONS_API.md)

`openapi.json` là nguồn chính xác cho request/response schema. Các guide giải thích workflow, authorization và invariant.
