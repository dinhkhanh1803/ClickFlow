# Integration Task — Activity Notifications

## Delivered

- The application header notification bell now reads persisted task activity already loaded through the authenticated Workspace API integration.
- Activity types are translated into concise user-facing titles and descriptions with actor and task context.
- Notifications are sorted newest-first, limited to the latest 30 items, and deep-link to the affected task.
- Read and mark-all-read actions persist per signed-in user in browser storage.
- Loading and empty states, outside-click dismissal, Escape dismissal, unread badge, and keyboard-accessible links are included.

## Current boundary

Read receipts are device-local. A later multi-device notification service can replace this storage adapter without changing the popover UI. The event source remains the immutable backend Activity History rather than duplicated mock notification data.

## Verification

- Notification model and header interaction tests: 13 passed.
- Web TypeScript typecheck: passed.
- Web lint: passed with four pre-existing warnings.
