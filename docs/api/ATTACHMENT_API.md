# Attachment API — Task 10

Upload dùng signed-URL workflow; API không nhận file binary trực tiếp.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `POST` | `/workspaces/{workspaceId}/attachments/upload-intents` | Cấp storage key và signed upload URL |
| `POST` | `/workspaces/{workspaceId}/attachments/complete` | Verify object rồi tạo attachment metadata |
| `GET` | `/workspaces/{workspaceId}/attachments/{attachmentId}/download-url` | Cấp signed download URL ngắn hạn |
| `DELETE` | `/workspaces/{workspaceId}/attachments/{attachmentId}` | Xóa metadata và object theo cách idempotent |

Client phải upload đúng key, MIME type và byte size từ intent trước khi gọi `complete`. Server kiểm tra namespace workspace, metadata và magic bytes. Bucket không public; URL tải xuống có thời hạn.

Storage boundary và production requirements nằm tại [`ADR-002-OBJECT-STORAGE.md`](../engineering/ADR-002-OBJECT-STORAGE.md).
