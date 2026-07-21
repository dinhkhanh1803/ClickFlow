# Archive and retention policy

Project, task and project-template removal is a reversible soft archive. Normal list, search, dashboard and report queries exclude archived records. Restore verifies that required parent project and task status records are active before clearing `archivedAt`, and writes an activity event.

Permanent deletion is deliberately deferred because the current MVP UI has no explicit destructive action or confirmation flow. Adding it requires a separate owner-only endpoint, typed confirmation, audit event, retention window and attachment-object deletion policy; soft archive must not silently become permanent deletion.

Template snapshots contain statuses, sections, tasks and checklist items only. They exclude comments, activity, attachments and time entries. Instantiation runs in one database transaction and records a workspace-scoped idempotency key.
