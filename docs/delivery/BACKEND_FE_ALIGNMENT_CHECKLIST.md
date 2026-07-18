# Backend Checklist theo Frontend hiện tại

Checklist này chuyển hành vi mock/local hiện có của `apps/web` thành thứ tự triển khai backend. Nguồn contract chính là `apps/web/src/features/workspace/model/local-navigation.ts`; model cũ `workspace-types.ts` chỉ dùng để đối chiếu cho đến khi frontend hợp nhất repository.

## 0. Khóa mapping domain trước Prisma

- [x] Chốt `Space` trên UI ánh xạ thành `Workspace` trên API; không tạo entity `Space` riêng.
- [x] Chốt `Folder` ánh xạ thành `Project` và `List` ánh xạ thành `Section` hoặc resource `List`; tên API phải ổn định trước migration đầu tiên.
- [x] Chốt `Doc` là entity persisted vì FE đã hỗ trợ tạo, sửa, import và export document.
- [x] Chốt cách lưu item `dashboard`, `whiteboard`, `form`: chỉ metadata/navigation trong MVP hoặc hoãn content API.
- [x] Chọn `local-navigation.ts` làm contract FE chuẩn; lập kế hoạch bỏ model trùng `workspace-types.ts` sau khi từng vertical slice dùng API.
- [x] Chuẩn hóa status: FE hỗ trợ status theo scope `space`, `folder`, `list`, trong khi kế hoạch BE hiện mới thiên về project status.
- [x] Chuẩn hóa priority từ FE `Urgent | High | Normal | Low`; loại bỏ contract cũ `low | medium | high` hoặc ghi adapter rõ ràng.
- [x] Đổi `assignee` free-text thành `assigneeId`; response có object/summary đủ để FE hiển thị tên và initials.
- [x] Tất cả timestamp API dùng ISO 8601 UTC; FE tự format theo timezone/locale.
- [x] Ghi mapping và ví dụ request/response vào `packages/contracts` và OpenAPI trước khi code repository.

## 1. Prisma foundation và workspace isolation — P0

- [x] Tạo `User`, `Session`, `Workspace`, `WorkspaceMember`, `Project`, `Section/List`, `Document`, `Task`, `TaskStatus`, `Comment`, `Attachment`, `TimeEntry`, `Tag`, `TaskTag`, `ActivityLog`.
- [x] Mọi resource nghiệp vụ có `workspaceId` trực tiếp hoặc có đường FK bắt buộc về workspace.
- [x] Dùng UUID, `createdAt`, `updatedAt`, `archivedAt`; khai báo delete/cascade policy rõ cho từng FK.
- [x] Thêm index cho workspace tree, project/list, task status, assignee, due date, updated date và search.
- [x] Migration đầu tiên chạy được trên database rỗng; seed deterministic tạo một user, workspace, folder/project, list, doc và task.
- [x] Repository integration test chứng minh không đọc/sửa được resource của workspace khác.
- [x] Readiness probe kiểm tra kết nối database; liveness không phụ thuộc database.

## 2. Auth và current user — P0

FE liên quan: `/login`, `/forgot-password`, `/reset-password`, `/profile`.

- [ ] `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`.
- [ ] `GET /users/me` trả user và workspace membership mặc định.
- [ ] Forgot-password không làm lộ email có tồn tại; reset token chỉ dùng một lần.
- [ ] Login thay mock redirect hiện tại mà không đổi public route `/login`.
- [ ] Có test login → refresh → logout, token hết hạn/reuse và rate limit.

## 3. Workspace tree và navigation — P0

FE liên quan: Space sidebar, `/projects`, query `space`, `folder`, `list`, `doc`.

- [ ] `GET/POST /workspaces`; `GET/PATCH /workspaces/:id`; hỗ trợ `name`, `tone`, `private`.
- [ ] `GET /workspaces/:id/tree` trả tree đủ để dựng sidebar bằng một request.
- [ ] CRUD folder/project và list/section; hỗ trợ `parentId`, rename, move và stable ordering.
- [ ] CRUD document metadata/content; dùng optimistic concurrency để tránh ghi đè nội dung cũ.
- [ ] Giữ URL FE hiện tại bằng adapter tạo `href` từ ID trả về, không để backend trả route hard-coded.
- [ ] Không cho move item sang workspace khác; không tạo cycle trong hierarchy.
- [ ] Test empty workspace, private workspace, rename, move, reorder và cross-workspace IDOR.

## 4. Custom status theo scope — P0

FE liên quan: `statusGroups`, `statusOverrides`, status chart và các picker Board/List/Table.

- [ ] CRUD status definition với `name`, `color`, `scopeType`, `scopeId`, `order`, `completed`.
- [ ] Resolve status hiệu lực theo thứ tự list → folder/project → workspace.
- [ ] Hỗ trợ rename/color override mà không làm mất liên kết task hiện tại.
- [ ] Không xóa status đang được dùng nếu chưa chọn replacement status trong cùng transaction.
- [ ] Khi chuyển task vào completed status, set `completedAt`; khi rời completed status, áp dụng rule đã chốt.
- [ ] Test inheritance, override, reorder, replacement và scope isolation.

## 5. Task core khớp mọi view FE — P0

FE liên quan: Board, List, Calendar, Gantt/Timeline, Table và task detail modal.

- [ ] Task contract có `title`, `description`, `statusId`, `priority`, `assigneeId`, `startDate`, `dueDate`, `timeEstimateSeconds`, `createdAt`, `updatedAt`.
- [ ] `GET /tasks` filter theo workspace/project/list/status/assignee/date range; mặc định loại archived.
- [ ] `POST /tasks`, `GET/PATCH /tasks/:id`, archive/restore task.
- [ ] `POST /tasks/:id/move` cập nhật status và order trong transaction cho Board.
- [ ] Update từ Calendar/Gantt/Table dùng cùng mutation contract, không tạo endpoint riêng theo view.
- [ ] Thêm optimistic concurrency (`version` hoặc ETag) cho task update/move.
- [ ] Checklist item có create/update/toggle/delete và stable order.
- [ ] Tag là entity workspace-scoped; attach/detach task, unique `(taskId, tagId)`.
- [ ] My Tasks query dùng `assigneeId=currentUser`; calendar query dùng `startDate/dueDate` với boundary rõ.
- [ ] Test invalid date range, foreign status/list, lost update, concurrent move và archived behavior.

## 6. Comment, activity và attachment — P0/P1

FE liên quan: task detail có comment, links, file đính kèm và activity.

- [ ] Comment create/list/update/delete; body plain text hoặc format allowlist, có author summary và UTC timestamp.
- [ ] Comment hỗ trợ link list đã validate URL.
- [ ] Activity log chỉ backend ghi; client không có endpoint create/update/delete activity.
- [ ] Mỗi mutation task/checklist/comment quan trọng ghi activity trong cùng transaction.
- [ ] Thay `dataUrl` local bằng upload intent → object storage → complete attachment.
- [ ] Attachment contract giữ `id`, `name`, `mimeType`, `size`, `createdAt`; download qua signed URL ngắn hạn.
- [ ] Validate size, MIME/magic bytes và authorization trước upload/download/delete.
- [ ] Test comment ordering, activity immutability, spoofed MIME và cross-workspace attachment access.

## 7. Timer và time tracking — P0

FE hiện có `trackingStartedAt`, `trackedSeconds`, timer trong task detail; route `/time-tracking` còn placeholder.

- [ ] `POST /timers/start`, `/timers/stop`, `GET /timers/current`.
- [ ] Mỗi user chỉ có một timer đang chạy, được bảo vệ bằng constraint/transaction ở database.
- [ ] Stop timer tính duration server-side; retry start/stop có semantics idempotent.
- [ ] CRUD manual time entry và filter theo task/project/date range.
- [ ] Response task trả time summary cần thiết nhưng không nhúng toàn bộ time-entry history.
- [ ] Test concurrent start, double stop, retry và timezone/day boundary.

## 8. Dashboard và global search — P0

FE liên quan: `deriveLocalDashboard` và `searchLocalWorkspace`.

- [ ] `GET /dashboard` trả counts cho workspaces/spaces, lists, open tasks, overdue tasks.
- [ ] Dashboard trả `dueToday`, `assignedToMe`, `upcomingDeadlines` và progress theo folder/project.
- [ ] Định nghĩa completed task bằng status metadata, không dùng regex `complete|done` như local mock.
- [ ] `GET /search?q=&filter=` hỗ trợ workspace/project/list/doc/task, pagination và archived filter.
- [ ] Search chỉ trong workspace hiện tại và trả IDs/context; FE tiếp tục tự xây URL.
- [ ] Test số liệu dashboard với fixture, search ranking/filter và cross-workspace leak.

## 9. Các route FE đang placeholder — P1 sau core

- [ ] `/archive`: list archived project/list/doc/task và restore có kiểm tra parent hợp lệ.
- [ ] `/templates`: project template và instantiate transaction/idempotency.
- [ ] `/reports`: time/progress report sau khi time entry và completed status ổn định.
- [ ] `/settings` và `/workspace-settings`: timezone, locale, workspace preferences; không lưu secret tùy ý.
- [ ] `/profile`: update display name/avatar sau `GET /users/me`.
- [ ] Whiteboard/form/dashboard item content chỉ triển khai khi FE có acceptance criteria, không mở rộng schema sớm.

## 10. Chiến lược thay localStorage bằng API

- [ ] Tạo repository interface tại từng feature trước; component không gọi `fetch` trực tiếp.
- [ ] API repository giữ shape FE hoặc có mapper tập trung; không duy trì hai bộ type thủ công lâu dài.
- [ ] Tích hợp theo thứ tự: auth → workspace tree → status/task → comments/activity → timer → dashboard/search → attachments → P1 routes.
- [ ] Mỗi slice có loading, empty, 401, 403, 404, 409 và retry/cancel behavior.
- [ ] Chỉ optimistic update khi có rollback; hiển thị conflict `409` rõ cho task/document.
- [ ] Có migration/import một lần cho dữ liệu `clickflow.local-spaces.v1` hoặc quyết định rõ dữ liệu mock sẽ bị bỏ.
- [ ] Giữ feature flag/local fallback trong development cho đến khi E2E API của slice xanh.
- [ ] Xóa listener `clickflow:local-spaces-changed` và localStorage dependency chỉ sau khi dashboard/search/workspace cùng chuyển sang API.

## Definition of Done cho backend bám FE

- [ ] OpenAPI và `packages/contracts` thống nhất; compatibility check xanh.
- [ ] Core flow login → workspace tree → task update → comment → timer → dashboard/search chạy E2E với PostgreSQL thật.
- [ ] Mọi query đều workspace-scoped; IDOR negative tests xanh.
- [ ] Không còn binary `dataUrl`, password/token hoặc secret trong database fixture/log.
- [ ] API lint, typecheck, unit, integration, contract và build xanh trong CI.
- [ ] Các public route và hành vi người dùng hiện tại của FE không đổi khi chuyển repository sang API.
