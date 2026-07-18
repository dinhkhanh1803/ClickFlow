# Domain Model

`User` participates in a `Workspace` through `WorkspaceMember`; the creator is retained separately for ownership.
A workspace contains a project tree (`Project`), lists (`Section`), persisted documents, navigation metadata, scoped task
statuses, tasks, tags, time entries, activity logs, and project templates.

Frontend vocabulary maps to persisted API resources as follows:

- Space → `Workspace`
- Folder → `Project`
- List → `Section`
- Doc → `Document`
- Dashboard, whiteboard, and form → `WorkspaceNavigationItem` metadata in the MVP

Every business record has a direct `workspaceId`. Repository methods must include it in read and mutation predicates.
`TaskStatus` supports `WORKSPACE`, `PROJECT`, and `SECTION` scope without introducing parallel status models.

A task belongs to one project and one effective status. It may belong to a section, assignee, and parent task. Checklist
items, tags through `TaskTag`, comments, attachments, and time entries extend the task aggregate. Activity logs are
system-written and immutable through the public API.

The executable schema and relationship policies live in `apps/api/prisma/schema.prisma`; migration and recovery rules
are documented in [DATABASE_DESIGN_PLAN.md](./DATABASE_DESIGN_PLAN.md).
