# Integration Task 7 ? Attachments and Documents

## Delivered

- Task attachments use the backend signed-upload workflow: intent, object upload, and completion.
- PDF, JPEG, and PNG restrictions are enforced before upload and backend errors surface as UI toasts.
- Download URL and delete operations are exposed through the typed attachment client.
- Existing document editing remains on the established local document model.

## Contract boundary to review

The current backend exposes no Document CRUD endpoint even though Prisma persists a Document entity. Consequently this task does not pretend that local document edits are synchronized. A future Document API slice must add list/create/update/import/export endpoints before replacing the local editor persistence.

## Manual review

1. Open a persisted Task and attach a PDF, JPEG, or PNG while using an object-storage provider with browser-accessible signed URLs.
2. Confirm unsupported file types are rejected.
3. Review document editing separately; it remains local until the missing backend contract exists.
