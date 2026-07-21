# Attachment API — Task attachments

Upload dùng signed-URL workflow; API không nhận file binary trực tiếp.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `POST` | `/workspaces/{workspaceId}/attachments/upload-intents` | Cấp storage key và signed upload URL |
| `POST` | `/workspaces/{workspaceId}/attachments/complete` | Verify object rồi tạo attachment metadata |
| `GET` | `/workspaces/{workspaceId}/attachments/{attachmentId}/download-url` | Cấp signed download URL ngắn hạn |
| `DELETE` | `/workspaces/{workspaceId}/attachments/{attachmentId}` | Xóa metadata và object theo cách idempotent |

Client phải upload đúng key, MIME type và byte size từ intent trước khi gọi `complete`. Server kiểm tra namespace workspace, metadata và magic bytes. Bucket không public; URL tải xuống có thời hạn.

Storage boundary và production requirements nằm tại [`ADR-002-OBJECT-STORAGE.md`](../engineering/ADR-002-OBJECT-STORAGE.md).

## Cloudflare R2 production provider

Production/staging nên dùng Cloudflare R2 vì R2 là S3-compatible private object storage và phù hợp với attachment ảnh, tài liệu, video.

API env cần có:

```bash
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

Upload-intent response vẫn provider-neutral:

- `uploadMethod=PUT` với `uploadHeaders` nghĩa là browser upload file trực tiếp lên R2 bằng signed URL.
- `uploadMethod=POST` với `uploadFields` vẫn còn hỗ trợ cho Cloudinary legacy.
- Secret key chỉ dùng ở backend để ký URL, không trả về browser.

R2 bucket phải private. Downloads dùng short-lived signed URLs. Trước khi PostgreSQL metadata được commit, backend gọi `HEAD` object để validate MIME type, byte size và checksum metadata.

## Local/test provider

Local test và automated tests mặc định dùng in-memory provider:

```bash
STORAGE_PROVIDER=memory
```

Provider này không bền vững sau khi restart process, chỉ dùng cho test hoặc demo rất nhanh.

## Cloudinary legacy provider

Cloudinary vẫn được giữ lại để tránh phá môi trường cũ:

```bash
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Không nên dùng Cloudinary làm mặc định mới nếu mục tiêu là giảm chi phí attachment.