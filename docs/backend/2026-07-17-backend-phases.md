# ClickFlow Backend Phases

**Status:** Approved design  
**Date:** 2026-07-17  
**Scope:** Lộ trình triển khai backend MVP, bắt đầu từ skeleton độc lập.

## Nguyên tắc triển khai

- Mỗi phase phải chạy, kiểm thử và có tiêu chí hoàn thành riêng.
- API dùng REST, prefix `/api/v1`, và Swagger/OpenAPI là contract công khai.
- Dữ liệu dùng PostgreSQL + Prisma; khóa chính UUID; mọi timestamp lưu UTC.
- Không đưa nghiệp vụ vào phase nền tảng. Mỗi phase chỉ mở rộng các capability đã được dependency bảo đảm.
- Các API phải dùng validation, error envelope và logging thống nhất ngay từ BE-01.

## Tổng quan

| Phase | Mục tiêu | Phụ thuộc |
| --- | --- | --- |
| BE-01 | API skeleton và chuẩn nền tảng | Không có |
| BE-02 | Persistence với PostgreSQL/Prisma | BE-01 |
| BE-03 | Identity và ownership | BE-02 |
| BE-04 | Project và task management | BE-03 |
| BE-05 | Collaboration và productivity | BE-04 |
| BE-06 | Hardening và release readiness | BE-01 đến BE-05 |

## BE-01 — Backend Skeleton

### Mục tiêu

Khởi tạo NestJS REST API có thể chạy và kiểm thử độc lập, áp dụng các quy ước chung cho mọi endpoint về sau.

### In scope

- NestJS + TypeScript tại `apps/api` theo cấu trúc module rõ ràng.
- Scripts workspace cho development, build, lint và test.
- Cấu hình môi trường có validation, `.env.example` cho biến bắt buộc và phân tách development/test/production.
- Global prefix `/api/v1`.
- `GET /api/v1/health` trả trạng thái ứng dụng mà không cần database.
- Swagger/OpenAPI được phục vụ từ ứng dụng và mô tả health endpoint.
- Global validation pipe cho payload API.
- Chuẩn error response: `{ code, message, details, requestId }`.
- Request ID và structured logging; lỗi không được lộ stack trace hoặc secret cho client.
- Unit-test và e2e-test harness; test health endpoint và error contract.

### Out of scope

- Prisma schema, kết nối PostgreSQL, migration, seed hoặc Docker Compose.
- Authentication, user/workspace entities và authorization guards.
- Endpoint nghiệp vụ: projects, tasks, uploads, comments, time tracking hoặc reports.
- CI/CD và cấu hình deploy Render.

### Tiêu chí hoàn thành

- API khởi động bằng một lệnh documented và Swagger truy cập được trong môi trường development.
- `GET /api/v1/health` trả `200` với payload đã được mô tả trong OpenAPI.
- Payload không hợp lệ nhận error envelope chuẩn cùng `requestId`.
- Test unit và e2e của API chạy xanh từ root workspace.
- Không có secret hard-code; cấu hình thiếu hoặc sai bị chặn ngay khi ứng dụng khởi động.

## BE-02 — Persistence Foundation

### Mục tiêu

Thiết lập nền dữ liệu local và production-compatible để module nghiệp vụ có migration đáng tin cậy.

### In scope

- PostgreSQL và Prisma.
- Docker Compose cho PostgreSQL local.
- Prisma client, migration và seed strategy.
- Quy ước UUID, UTC timestamps, `createdAt`, `updatedAt`, optional `deletedAt` và `archivedAt`.
- Database health/readiness check và test database strategy.

### Out of scope

- User-facing authentication flow.
- Entity nghiệp vụ đầy đủ ngoài những entity tối thiểu cần để kiểm chứng migration.

### Tiêu chí hoàn thành

- Developer tạo được database local, chạy migration và seed bằng lệnh documented.
- Test tích hợp có database cô lập và dọn dữ liệu sau khi chạy.
- Migration có thể áp dụng từ database trống mà không cần thao tác thủ công.

## BE-03 — Identity and Ownership

### Mục tiêu

Cung cấp đăng ký, đăng nhập và xác thực ownership an toàn cho các resource tiếp theo.

### In scope

- User, Workspace và WorkspaceMember data model theo domain model.
- Email/password với password hashing mạnh.
- Access token ngắn hạn; refresh token rotation/revocation trong cookie `HttpOnly` phù hợp.
- Register, login, refresh, logout, current-user và password reset flow.
- Authentication guard, ownership/workspace context và rate limiting cho auth endpoints.

### Out of scope

- Social login.
- Enterprise roles/permissions hoặc collaboration workflow hoàn chỉnh.

### Tiêu chí hoàn thành

- Chỉ request đã xác thực mới truy cập endpoint bảo vệ.
- Logout/revocation khiến refresh token cũ không còn dùng được.
- Mỗi resource gắn đúng workspace ownership; test cover trường hợp cross-workspace bị từ chối.

## BE-04 — Core Work Management

### Mục tiêu

Xây dựng nghiệp vụ cốt lõi để người dùng quản lý dự án và công việc.

### In scope

- Projects, project statuses, sections và milestones khi cần cho MVP.
- Tasks, subtasks, checklist items, tags và task-tag relation.
- CRUD, pagination/filter/sort/search cơ bản theo API design plan.
- Archive/restore và activity log cho mutation quan trọng.
- Transaction cho các mutation nhiều bước.

### Out of scope

- File upload, comment, timer/time entry, templates và reports.

### Tiêu chí hoàn thành

- User chỉ đọc/sửa được dữ liệu của workspace mình.
- Business rules cho project/task và task status được kiểm thử ở service lẫn API boundary.
- List endpoints đáp ứng phân trang, filter và sort đã document.

## BE-05 — Collaboration and Productivity

### Mục tiêu

Hoàn thiện các workflow MVP quanh task sau khi core model ổn định.

### In scope

- Comments và activity history.
- Attachment metadata cùng storage abstraction; chọn provider object storage trước khi triển khai production upload.
- Time entries và một timer hoạt động trên mỗi user theo business rules.
- Templates, search nâng cao và reports cơ bản.

### Out of scope

- Realtime multiplayer editing, team chat, notification nâng cao và native mobile.

### Tiêu chí hoàn thành

- Attachment tuân thủ giới hạn loại/kích thước và ownership.
- Một user không thể có nhiều timer đang chạy đồng thời.
- Reports/search chỉ trả dữ liệu trong workspace của request.

## BE-06 — Hardening and Release Readiness

### Mục tiêu

Đưa API đến mức sẵn sàng tích hợp frontend, kiểm thử hệ thống và deploy.

### In scope

- Security review: CORS, CSRF cho cookie flow, rate limiting, headers và secret management.
- Observability: structured logs, request IDs, health/readiness và error monitoring integration point.
- Database index review, performance test cho list/search và backup/restore rehearsal.
- CI checks, production environment configuration và Render deployment configuration.
- OpenAPI publishing/validation và integration-test support cho frontend.

### Tiêu chí hoàn thành

- CI chạy lint, typecheck, unit, integration và e2e tests phù hợp.
- Render deploy có health check, environment variables documented và rollback/runbook rõ ràng.
- Không còn lỗi high-severity trong security review; API contract được versioned và publish được.

## Thứ tự thực thi

Chỉ bắt đầu BE-02 khi BE-01 hoàn thành. BE-03 mở khóa mọi module có ownership; BE-04 trước BE-05 để giữ domain core ổn định. BE-06 diễn ra xuyên suốt ở mức tối thiểu nhưng chỉ chốt release sau khi các phase chức năng hoàn tất.

