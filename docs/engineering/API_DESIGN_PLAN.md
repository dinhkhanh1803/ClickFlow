# API Design Plan

REST base path `/api/v1`, resource số nhiều (`/projects`, `/tasks`), dùng HTTP methods chuẩn. List hỗ trợ cursor/page, filter, sort, search; API trả status code đúng ngữ nghĩa và error `{ code, message, details, requestId }`. Validation ở boundary, mutation nhạy cảm hỗ trợ idempotency key, version qua path, Swagger/OpenAPI là contract.

Modules dự kiến: auth; workspaces; projects/statuses/sections; tasks/subtasks/checklists/tags; comments/attachments; time entries/timer; templates; reports; archive; settings. Header xác thực `Authorization: Bearer <access-token>`; endpoint chưa được code trong Phase 0.
