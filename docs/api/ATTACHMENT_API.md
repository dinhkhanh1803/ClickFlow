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

## Cloudinary production provider

Set `STORAGE_PROVIDER=cloudinary` together with the three `CLOUDINARY_*` credentials. Tests and unconfigured local environments keep using the in-memory provider.

The upload-intent response is provider-neutral:

- `uploadMethod=POST` with `uploadFields` means the browser sends multipart form data to Cloudinary.
- `uploadMethod=PUT` with `uploadHeaders` remains available for S3-compatible providers.
- The API secret is used only by the backend to sign fields and is never returned to the browser.

Cloudinary assets use private delivery. Downloads use short-lived signed URLs. Before PostgreSQL metadata is committed, the backend reads the stored asset and validates its workspace key, signed MIME metadata, byte size, and magic bytes.
