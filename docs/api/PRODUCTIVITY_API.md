# Template, Archive and Settings API — Task 11

Tất cả endpoint yêu cầu Bearer token và workspace membership.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `GET/POST` | `/workspaces/{workspaceId}/project-templates` | List hoặc tạo template snapshot |
| `POST` | `/workspaces/{workspaceId}/project-templates/{templateId}/instantiate` | Tạo project từ template |
| `DELETE` | `/workspaces/{workspaceId}/project-templates/{templateId}` | Archive template |
| `GET` | `/workspaces/{workspaceId}/archive` | List project/task/template đã archive |
| `POST` | `/workspaces/{workspaceId}/archive/{type}/{id}/restore` | Restore resource và kiểm tra parent |
| `GET/PATCH` | `/workspaces/{workspaceId}/settings` | Đọc hoặc cập nhật workspace preferences |

Instantiate yêu cầu `Idempotency-Key` và chạy trong một transaction. Snapshot chỉ gồm cấu trúc project, status, section, task mẫu và checklist; không copy comment, activity, attachment hoặc time history.

Retention policy nằm tại [`ARCHIVE_RETENTION_POLICY.md`](../engineering/ARCHIVE_RETENTION_POLICY.md).
