# Document API and editor workflow

Documents are persisted workspace resources. A Doc may live directly in a Workspace (`projectId: null`) or inside a Folder/Project (`projectId` set).

## Endpoints

All routes require `Authorization: Bearer <access-token>` and verify membership for the `workspaceId` in the URL.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/workspaces/:workspaceId/documents` | List active Docs; optional `projectId` filter |
| `GET` | `/api/v1/workspaces/:workspaceId/documents/:documentId` | Read one Doc |
| `POST` | `/api/v1/workspaces/:workspaceId/documents` | Create a Workspace- or Folder-level Doc |
| `PATCH` | `/api/v1/workspaces/:workspaceId/documents/:documentId` | Rename and/or save HTML content |
| `DELETE` | `/api/v1/workspaces/:workspaceId/documents/:documentId` | Soft-delete/archive a Doc |

## Create example

```json
{
  "title": "Project brief",
  "projectId": "04bd9d6d-7f78-4f84-b757-b9acb63f21c1",
  "content": ""
}
```

Use `projectId: null` when creating directly in a Space. `sectionId` is reserved for future List-level placement.

## Save example

```json
{
  "contentVersion": 3,
  "title": "Launch brief",
  "content": "<h2>Goals</h2><p>Ship safely.</p>"
}
```

Every update increments `contentVersion`. A stale version returns `409 Conflict`. The web editor serializes saves and debounces content changes by 500 ms.

## Frontend behavior

- Create Doc is available from a Space or Folder creation menu and opens the new Doc immediately.
- Editor content is sanitized before persistence and autosaved through the API.
- Rename, add page, duplicate, import `.docx`, export `.docx`, copy link, and archive are supported.
- Import/export happens in the browser; imported HTML uses the same versioned update API.
- Without an authenticated API session, the local-storage workflow remains available.

## Activity history

Mutations emit `DOCUMENT_CREATED`, `DOCUMENT_UPDATED`, and `DOCUMENT_ARCHIVED` activity records.
