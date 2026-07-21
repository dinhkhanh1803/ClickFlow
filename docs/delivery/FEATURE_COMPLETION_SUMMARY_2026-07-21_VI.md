# Tổng hợp triển khai Auth, Space và các luồng lõi - 2026-07-21

Tài liệu này ghi lại các phần đã hoàn thành trên nhánh `feat/frontend-backend-integration` để bạn nắm trạng thái dự án và tiếp tục phát triển.

## 1. Auth/Register

- Đã khóa bypass ở `/auth/register`: endpoint cũ không còn tự đăng nhập/tạo session ngay sau đăng ký.
- Luồng đăng ký email đi qua cơ chế email verification giống `/auth/register-email`.
- Các test backend cũ được cập nhật để tạo user đúng luồng verify email trước khi login.

Commit: `ddbd506 fix(auth): require email verification for register`

## 2. E2E Auth + core Space flow

- Thêm mock API dùng cho Playwright để test luồng frontend mà không phụ thuộc backend thật.
- Test được luồng: login, tạo Space, tạo Folder, Folder tự có List mặc định, tạo Task inline.
- Playwright config hỗ trợ chạy với dev server đang mở bằng `PLAYWRIGHT_SKIP_WEBSERVER=1`.

Commit: `4550287 test(web): add auth and space e2e flow`

## 3. Share/Invite members

- Backend có endpoint mời member vào Space bằng email người dùng đã tồn tại.
- Chỉ Owner được invite member.
- Frontend Share dialog load danh sách member và thêm người mới vào Space.
- E2E kiểm tra invite bằng email.

Commit: `9e40152 feat(workspaces): invite space members`

## 4. Public/Private permission

- Space Public có quyền `View only` hoặc `Can edit`.
- Public `View only` bị khóa các thao tác tạo Folder/List/Task từ UI.
- Backend permission test xác nhận rule owner/member/public đúng.
- E2E kiểm tra người xem public không tạo được dữ liệu.

Commit: `86004e7 fix(workspaces): lock view-only public spaces`

## 5. My Tasks, Calendar, Settings

- `/my-tasks` hiển thị task được assign cho user hiện tại từ workspace data.
- `/calendar` gom task có due date theo lịch.
- `/settings` hiển thị user/workspace settings và lưu cấu hình timezone/locale/preferences.
- E2E kiểm tra 3 màn hình này đọc/lưu dữ liệu.

Commit: `2116b13 feat(productivity): implement tasks calendar and settings`

## 6. Thay toàn bộ `window.prompt`

- Thêm reusable `TextInputDialog`.
- Rename Folder/List và các thao tác document link/rename chuyển sang dialog trong app.
- Đã kiểm tra không còn `window.prompt` trong `apps` và `packages`.

Commit: `47794cb refactor(web): replace native prompt dialogs`

## 7. Restore/Duplicate Space

- Backend thêm API:
  - `GET /api/v1/workspaces/archived`
  - `POST /api/v1/workspaces/:workspaceId/restore`
  - `POST /api/v1/workspaces/:workspaceId/duplicate`
- Soft-delete Space chuyển Space sang archived list.
- Restore đưa Space archived trở lại active list.
- Duplicate tạo Space copy cho owner, clone cấu trúc chính của Space như projects/sections/statuses/tasks/documents ở backend.
- Sidebar có nút `Archived`, dialog danh sách archived Space và nút `Restore`.
- More menu của Space có `Duplicate` dùng API khi đã đăng nhập.
- E2E kiểm tra tạo Space → duplicate → archive → restore.

Commit: `72dd717 feat(workspaces): restore and duplicate spaces`

## Lệnh kiểm tra đã chạy

Các lệnh verification chính đã pass:

```bash
pnpm --filter api typecheck
pnpm --filter api test -- workspace.service.test.ts
pnpm --filter web typecheck
pnpm --filter web lint
cd apps/web
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 ./node_modules/.bin/playwright.cmd test e2e/core-space-flow.spec.ts
```

Kết quả đáng chú ý:

- API workspace service: 10/10 tests pass.
- Playwright core Space flow: 5/5 tests pass.
- Web/API typecheck pass.
- Web lint pass với 0 error; còn 4 warning cũ ngoài scope ở register form, time tracking và local task surface.

## Ghi chú cho bước tiếp theo

- File `package-lock.json` đang untracked và không thuộc scope các commit trên.
- Nếu muốn chạy E2E bằng tay, hãy mở dev server web ở `http://127.0.0.1:3000` trước, rồi chạy lệnh Playwright ở trên.
- Các phần nên ưu tiên tiếp: dọn warning lint cũ, cập nhật test legacy `workspace-root.test.tsx` đang lệch với flow Space mới, và chạy thêm E2E với backend/PostgreSQL thật khi môi trường ổn định.
