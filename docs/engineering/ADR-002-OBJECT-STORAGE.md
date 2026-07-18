# ADR-002: production object storage

## Decision

Use an S3-compatible private bucket through the `StorageProvider` interface. Production should use Cloudflare R2 when deployment pricing and data residency are approved; AWS S3 remains a drop-in fallback. The API issues short-lived signed upload (10 minutes) and download (5 minutes) URLs and never uses the client filename as an object key.

## Security and operations

- Keys are `workspaces/{workspaceId}/attachments/{uuid}`. Buckets deny public access.
- Complete verifies provider metadata, maximum 10 MiB, MIME allowlist and magic bytes before an active database record exists.
- Provider-side malware scanning/quarantine must be enabled before broadening the allowlist beyond PDF/JPEG/PNG.
- Deletion is retry-safe: metadata is soft-deleted and object deletion is idempotent. A scheduled orphan sweep removes unreferenced keys after the upload-intent grace period.
- The in-memory provider is only for local/automated tests; staging and production must fail startup until a durable adapter and credentials are configured.

This design is compatible with Render because uploads bypass the ephemeral application filesystem.
