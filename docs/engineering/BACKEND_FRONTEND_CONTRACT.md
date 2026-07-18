# Backend–Frontend Domain Contract

## Quyết định đã khóa

| Frontend | API/Database | Quyết định |
|---|---|---|
| `Space` | `Workspace` | Chỉ là khác biệt nhãn UI; không có entity `Space`. |
| `Folder` | `Project` | Folder hiện tại là boundary chứa Lists và Docs. |
| `List` | `Section` | API dùng `Section`; FE tiếp tục hiển thị nhãn “List”. |
| `Doc` | `Document` | Persist metadata, content, version và UTC timestamps. |
| `dashboard`, `whiteboard`, `form` | `WorkspaceNavigationItem` | MVP chỉ persist metadata, parent và position; content ngoài phạm vi cho đến khi có acceptance criteria. |

`apps/web/src/features/workspace/model/local-navigation.ts` là nguồn contract FE chuẩn. `workspace-types.ts` là legacy model và không được dùng để thiết kế Prisma mới.

## Status

Status API là `StatusDefinition` với `scopeType = WORKSPACE | PROJECT | SECTION`, `scopeId`, stable `key`, display `name`, `color`, `position` và category `OPEN | IN_PROGRESS | COMPLETED`. Task tham chiếu `statusId`; API không persist status dưới dạng free-text.

Frontend resolve status theo thứ tự Section → Project → Workspace. `statusGroupId` local sẽ được adapter sang `statusId`; `statusOverrides` chỉ tồn tại trong giai đoạn chuyển đổi và không trở thành bảng riêng.

## Priority và assignee

Priority API là `URGENT | HIGH | NORMAL | LOW`. UI map sang `Urgent | High | Normal | Low`; mock legacy `low | medium | high` map lần lượt sang `LOW | NORMAL | HIGH`.

Mutation dùng `assigneeId: UUID | null`. Response trả cả `assigneeId` và `assignee` summary gồm `id`, `displayName`, `initials`, `avatarUrl`; free-text assignee không đi qua API.

## Timestamp

Mọi datetime response dùng ISO 8601 UTC, ví dụ `2026-07-18T00:00:00.000Z`. Trường chỉ có ngày như `startDate`, `dueDate` dùng `YYYY-MM-DD`. Frontend chịu trách nhiệm format timezone/locale.

## Ví dụ contract

`packages/contracts/src/domain-contract.ts` chứa schema/type và ba fixture chuẩn:

- `workspaceTreeResponseExample`
- `createTaskRequestExample`
- `taskResponseExample`

Các fixture tương ứng cũng được publish trong OpenAPI `components.examples`. Đây là contract trước Prisma; migration và controller phải tương thích với tên resource và enum đã khóa ở đây.

## Kế hoạch bỏ model frontend trùng

1. Thêm API repository và mapper dựa trên `local-navigation.ts`.
2. Chuyển workspace tree, status và task views sang repository mới theo vertical slice.
3. Giữ `workspace-types.ts` chỉ cho `ProjectWorkspace` cũ trong giai đoạn chuyển đổi.
4. Khi Board/List/Calendar/Gantt/Table và task detail cùng dùng API contract, xóa `workspace-store.tsx`, `workspace-types.ts` và adapter legacy.
5. Chỉ xóa localStorage `clickflow.local-spaces.v1` sau khi dashboard và search đã chuyển sang API.
