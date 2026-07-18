# ClickFlow Backend Implementation Plan

> Kế hoạch này triển khai Phase 3–4 (Backend Foundation và Backend Business Modules), sau khi các luồng mock-first của Phase 2 đã ổn định. Mỗi task dùng checkbox để theo dõi và phải hoàn thành test/acceptance criteria trước khi chuyển task phụ thuộc.

**Mục tiêu:** Xây dựng REST API production-ready cho MVP ClickFlow, thay thế dần local repositories của frontend mà không đổi public routes hoặc hành vi người dùng hiện có.

**Kiến trúc:** `apps/api` là NestJS modular monolith, stateless, cung cấp REST `/api/v1`; Prisma truy cập PostgreSQL; Swagger/OpenAPI là nguồn contract. Business rule nằm trong application/domain services, controller chỉ xử lý HTTP boundary. Mọi truy vấn dữ liệu đều được giới hạn theo workspace. File binary nằm ở object storage, database chỉ lưu metadata và storage key.

**Tech stack đề xuất:** Node.js LTS, NestJS, TypeScript strict, Prisma, PostgreSQL, Zod (shared/API contract boundary), Passport JWT, Argon2id, Swagger/OpenAPI, Pino, Vitest/Jest + Supertest, Testcontainers, pnpm và Turborepo.

**Quy ước domain:** Backend dùng tên `Workspace`; “Space” hiện có trên UI là nhãn trình bày của cùng resource, không tạo thêm entity `Space` trong database.

---

## Phạm vi và thứ tự phát hành

### Backend MVP bắt buộc

- Auth: đăng ký/bootstrap user đầu tiên, login, refresh rotation, logout, forgot/reset password, `GET /me`.
- Workspace/member foundation; project, custom status, section.
- Task, subtask, checklist, tag, Kanban ordering, My Tasks và Calendar queries.
- Comment, attachment metadata/signed URL, immutable activity log.
- Timer/time entry, dashboard, search, report cơ bản.
- Template, archive/restore và workspace/user settings.
- OpenAPI, migration, seed, observability, CI, deployment và backup/restore runbook.

### Chưa làm trong đợt này

- Billing, AI, realtime multiplayer, team chat, enterprise RBAC, notification nâng cao, public marketplace.
- Không triển khai microservice, event broker hoặc CQRS nếu chưa có số liệu chứng minh nhu cầu.

---

## Definition of Ready

- [ ] Phase 2 chốt schema Zod và repository interface của các flow sẽ tích hợp.
- [x] Mapping `Space` UI → `Workspace` API và mapping status (`Backlog`, `In progress`, `Done`) được ghi thành contract.
- [ ] PostgreSQL cho local/test/staging sẵn sàng; secret không nằm trong source hoặc fixture.
- [ ] Quyết định object storage được ghi bằng ADR trước Task 10; local fake provider được phép dùng trước đó.
- [ ] Acceptance criteria và response examples của từng endpoint được review trước khi code module.

---

## Task 1: Khóa contract và bootstrap `apps/api`

**Files chính:** `apps/api/package.json`, `apps/api/src/main.ts`, `apps/api/src/app.module.ts`, `apps/api/src/config/*`, `apps/api/test/*`, root `package.json`, `turbo.json`, `.env.example`, `packages/contracts/src/*`.

- [x] Viết test bootstrap thất bại trước: `/api/v1/health/live` trả `200` và unknown route trả error envelope chuẩn.
- [x] Khởi tạo NestJS với strict TypeScript, global prefix `/api/v1`, URI versioning, validation pipe, security headers, CORS allowlist và graceful shutdown.
- [x] Validate environment khi start; tách schema cho local/test/staging/production. Không có default bí mật cho production.
- [x] Chuẩn hóa success pagination và error `{ code, message, details, requestId }`; không lộ stack trace.
- [x] Thêm scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:integration`, `prisma:*`; nối vào Turbo mà không làm đổi script của web.
- [x] Xuất Swagger JSON deterministically và thêm contract compatibility check trong CI.

**Hoàn thành khi:** API build được, health/readiness hoạt động, config thiếu làm process fail-fast, lint/typecheck/unit test xanh.

## Task 2: Thiết kế schema Prisma và migration nền

**Files chính:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/*`, `apps/api/prisma/seed.ts`, `apps/api/src/database/*`, `docs/engineering/DATABASE_DESIGN_PLAN.md`.

- [x] Mô hình hóa `User`, `Session`, `PasswordResetToken`, `Workspace`, `WorkspaceMember`, `Project`, `ProjectStatus`, `Section`, `Task`, `ChecklistItem`, `Tag`, `TaskTag`, `Comment`, `Attachment`, `TimeEntry`, `ActivityLog`, `ProjectTemplate` và settings.
- [x] Dùng UUID, timestamp UTC, `createdAt`, `updatedAt`, `archivedAt`; chỉ thêm `deletedAt` cho resource thực sự có soft-delete.
- [x] Thêm unique constraints: `(workspaceId,userId)`, `(taskId,tagId)`, status name/order trong project; FK và delete policy phải explicit.
- [x] Thêm index theo workspace/project/status/assignee/due date/time range; chuẩn bị PostgreSQL full-text/trigram index cho search nếu benchmark cần.
- [x] Viết migration đầu tiên và deterministic seed tạo một user/workspace/project/status/task phục vụ dev/E2E; password seed lấy từ env test/dev.
- [x] Viết integration tests cho constraints, transaction rollback và workspace isolation ở repository layer.

**Hoàn thành khi:** database trống migrate/seed được; migration rollback/restore strategy được ghi lại; không có orphan FK hoặc cross-workspace read.

## Task 3: Cross-cutting platform và authorization

**Files chính:** `apps/api/src/common/*`, `apps/api/src/authorization/*`, `apps/api/src/observability/*`.

- [x] Tạo request ID middleware/interceptor, structured logger và redaction password/token/cookie/PII nhạy cảm.
- [x] Tạo exception filter ánh xạ validation, auth, conflict, not-found và unexpected error sang error envelope.
- [x] Tạo `CurrentUser`, workspace membership guard/policy và helper query bắt buộc `workspaceId`; test IDOR cho mọi pattern resource lồng nhau.
- [x] Thêm pagination/filter/sort DTO dùng allowlist, giới hạn page size, query timeout và idempotency key cho mutation nhạy cảm.
- [x] Thêm `/health/live`, `/health/ready`, DB check, metrics cơ bản: request count, latency, error rate, connection pool.

**Hoàn thành khi:** controller mới có thể dùng chung authz/error/logging; log có requestId nhưng không chứa secret; test IDOR nền xanh.

## Task 4: Authentication và session lifecycle

**Endpoints chính:** `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`; `GET /users/me`.

- [ ] Viết unit tests cho password policy, credential failure, expiry, refresh reuse detection và reset token one-time use.
- [ ] Hash password bằng Argon2id; access token ngắn hạn; refresh token opaque hoặc JWT được hash trong `Session`, rotation mỗi lần refresh và revoke token family khi reuse.
- [ ] Đặt refresh token trong cookie `HttpOnly`, `Secure` ở production, `SameSite` phù hợp; thêm CSRF protection cho cookie mutation và CORS allowlist.
- [ ] Rate-limit login/forgot/reset theo IP + identity; response forgot-password không làm lộ email tồn tại.
- [ ] Tạo mail adapter với fake implementation cho local/test; production provider là cấu hình thay thế, không chặn core auth implementation.
- [ ] Ghi audit event cho login success/failure, refresh reuse, logout và password reset; không ghi token.

**Hoàn thành khi:** auth E2E cover login → refresh → logout, session revoke, expired/reset/reused token và brute-force limit.

## Task 5: Workspace, project, status và section

**Endpoints chính:** `/workspaces`, `/workspaces/:id/members`, `/projects`, `/projects/:id`, `/projects/:id/statuses`, `/projects/:id/sections`.

- [ ] Bootstrap workspace cho user đầu tiên và chuẩn bị role `owner/member` dù MVP vận hành single-user.
- [ ] CRUD/list/archive project; name bắt buộc, deadline optional, workspace ownership bắt buộc.
- [ ] CRUD/reorder custom statuses và sections; không cho xóa status đang được task dùng trừ khi có replacement status trong cùng transaction.
- [ ] Tính progress/health qua query service có test rõ quy tắc deadline, completed task và overdue task.
- [ ] List API hỗ trợ pagination, archived filter, search và stable sort.
- [ ] Mỗi mutation quan trọng ghi `ActivityLog` trong cùng transaction.

**Hoàn thành khi:** project flows và invariants có unit + integration + HTTP tests; không thể tham chiếu status/section từ project khác.

## Task 6: Task core, Kanban, subtask, checklist và tag

**Endpoints chính:** `/tasks`, `/tasks/:id`, `/tasks/:id/move`, `/tasks/:id/checklist-items`, `/tags`, `/tasks/:id/tags`; query `/tasks?projectId=&assigneeId=&from=&to=`.

- [ ] Tạo/update/complete/archive/restore task; task thuộc đúng một project và đúng một status của project đó.
- [ ] Khi status hoàn thành: set `completedAt`; khi rời status hoàn thành: clear theo business rule đã chốt.
- [ ] Subtask dùng `parentTaskId`; chặn self-parent, cycle và cross-project parent; quy định depth tối đa trước khi public API.
- [ ] Checklist CRUD/toggle và tag attach/detach với unique `(taskId,tagId)`.
- [ ] Kanban move cập nhật status + thứ tự bằng transaction; dùng fractional/rank ordering hoặc rebalance có kiểm soát, tránh rewrite toàn board mỗi lần kéo.
- [ ] Thêm optimistic concurrency (`version`/ETag hoặc `updatedAt`) cho task mutations để phát hiện lost update.
- [ ] Cung cấp query cho My Tasks và Calendar, mặc định loại archived records.

**Hoàn thành khi:** các business rule task có unit tests; concurrent move không làm trùng/mất order; activity ghi đúng trong transaction.

## Task 7: Comment và activity history

**Endpoints chính:** `/tasks/:id/comments`, `/tasks/:id/activity`.

- [ ] Comment create/list/update/delete theo policy; body được validate độ dài và lưu plain text/format được allowlist.
- [ ] Activity log chỉ hệ thống ghi, client không có create/update/delete endpoint.
- [ ] Chuẩn hóa event type + metadata không chứa snapshot nhạy cảm; pagination theo cursor để history ổn định.
- [ ] Test authorization, ordering, archived task behavior và immutability.

**Hoàn thành khi:** frontend task detail lấy được comment/activity thật với response ổn định và không sửa được audit history.

## Task 8: Timer và time entry

**Endpoints chính:** `POST /timers/start`, `/timers/stop`; `GET /timers/current`; CRUD `/time-entries`.

- [ ] Dùng partial unique index/transaction/locking để đảm bảo mỗi user chỉ có một timer `RUNNING` kể cả hai request đồng thời.
- [ ] Stop timer tính duration server-side, bắt buộc dương; start/stop idempotent có semantics rõ.
- [ ] Manual entry validate `startedAt < endedAt`, duration, workspace/task ownership và overlap policy.
- [ ] List/filter theo task/project/date range; report query dùng UTC và trả timezone-neutral timestamps.
- [ ] Test concurrent start, double stop, retry có idempotency key và boundary qua ngày/timezone.

**Hoàn thành khi:** invariant “một timer đang chạy/user” được bảo vệ ở cả DB và service; dữ liệu report khớp time entries.

## Task 9: Dashboard, global search và reports

**Endpoints chính:** `GET /dashboard`, `/search`, `/reports/time`, `/reports/progress`.

- [ ] Dashboard trả active projects, due today, overdue, weekly hours, deadlines và project health bằng một response contract phù hợp UI.
- [ ] Search giới hạn theo workspace, loại archived mặc định, hỗ trợ project/task, rank và pagination; escape/sanitize search input.
- [ ] Reports tổng hợp time/progress theo date range/project; định nghĩa rõ inclusive/exclusive boundary và timezone hiển thị.
- [ ] Chạy `EXPLAIN ANALYZE` trên seed dataset đại diện; thêm index/caching chỉ theo bottleneck đo được.
- [ ] Đặt latency budget ban đầu: p95 read < 300 ms và mutation < 500 ms ở staging không cold-start; ghi benchmark để hiệu chỉnh.

**Hoàn thành khi:** số liệu dashboard/report được đối soát với truy vấn fixture; search không rò dữ liệu workspace khác.

## Task 10: Attachment và object storage

**Endpoints chính:** `POST /attachments/upload-intents`, `POST /attachments/complete`, `GET /attachments/:id/download-url`, `DELETE /attachments/:id`.

- [ ] Định nghĩa `StorageProvider` cho signed upload/download, metadata lookup và delete; fake/local provider dùng trong test.
- [ ] Chọn provider production bằng ADR dựa trên cost, signed URL, size limit, malware scanning và Render compatibility.
- [ ] Validate MIME bằng allowlist và magic bytes khi complete; giới hạn size; storage key phải namespaced theo workspace và không dùng filename người dùng làm path.
- [ ] Chỉ ghi attachment active sau khi verify upload; job/command cleanup orphan; delete metadata + object có retry an toàn.
- [ ] Authorization trước mọi signed URL; URL TTL ngắn; không proxy file lớn qua API nếu không cần.

**Hoàn thành khi:** upload/download/delete E2E chạy với test provider; cross-workspace access và spoofed MIME bị chặn.

## Task 11: Template, archive và settings

**Endpoints chính:** `/project-templates`, `/project-templates/:id/instantiate`, `/archive`, `/archive/:type/:id/restore`, `/settings`.

- [ ] Template lưu/copy structure (statuses, sections, task mẫu, checklist) nhưng không copy activity, comment, attachment hoặc time history.
- [ ] Instantiate template chạy trong transaction và idempotent khi client retry.
- [ ] Archive là soft state; default queries loại archived; restore kiểm tra parent/status còn hợp lệ.
- [ ] Permanent delete là endpoint/action riêng, yêu cầu xác nhận explicit và audit; chỉ thêm nếu MVP UI thật sự cần.
- [ ] Settings validate timezone, locale và workspace preferences; không lưu secret tùy ý.

**Hoàn thành khi:** template clone rollback toàn bộ nếu một bước lỗi; archive/restore nhất quán trên project/task/search/report.

## Task 12: Hardening, CI/CD và vận hành

**Files chính:** `.github/workflows/*`, `apps/api/Dockerfile`, `docs/delivery/DEPLOYMENT_PLAN.md`, `docs/engineering/*`, `docs/runbooks/*`.

- [ ] CI chạy install frozen lockfile, lint, typecheck, unit, integration/contract, build, migration check và dependency/security scan.
- [ ] Test pyramid: unit business rules; repository integration với PostgreSQL thật; Supertest API/contract; E2E auth + project + task + timer + upload intent.
- [ ] Security tests: IDOR, injection, auth abuse, CSRF/CORS, token reuse, upload validation; thêm request/body limits và rate limits.
- [ ] Container chạy non-root, có health check, graceful shutdown; deploy staging Render trước production.
- [ ] Production migration là release step riêng, forward-only; không tự chạy seed; có rollback application compatible với schema N/N-1.
- [ ] Cấu hình alert cho uptime, 5xx, p95 latency, DB connections, failed upload/job; tạo runbook incident.
- [ ] Thiết lập backup, retention và diễn tập restore; ghi RPO/RTO sau lần diễn tập đầu.
- [ ] Smoke test sau deploy và canary/manual gate trước production.

**Hoàn thành khi:** staging chạy đủ core E2E, restore đã được chứng minh, dashboard/alert hoạt động và release checklist có owner.

---

## Chiến lược tích hợp frontend (Phase 5)

Không thay toàn bộ mock repository trong một lần. Mỗi vertical slice giữ nguyên UI contract và có feature flag/fallback rõ ràng trong môi trường dev.

1. Auth + `GET /users/me`.
2. Workspace/project/status/section.
3. Task/checklist/tag/Kanban, sau đó My Tasks và Calendar.
4. Comment/activity và timer/time entry.
5. Dashboard/search/report.
6. Attachment, template, archive và settings.

Với mỗi slice:

- [ ] So sánh Zod frontend schema với OpenAPI; cập nhật `packages/contracts` thành contract dùng chung hoặc generate client/types từ OpenAPI, không duy trì hai type thủ công.
- [ ] Tạo API repository implement đúng interface local repository hiện có.
- [ ] Thêm loading/empty/error/401/403/409 states và hủy request khi navigation.
- [ ] Chỉ optimistic update cho mutation có rollback; xử lý `409` concurrency rõ cho người dùng.
- [ ] Chạy unit, integration và Playwright cho cả success/failure trước khi bỏ mock của slice.

---

## Dependency map và ước lượng

| Milestone | Tasks | Phụ thuộc | Ước lượng |
|---|---:|---|---:|
| M1 — Foundation | 1–3 | Phase 2 contracts | 5–7 ngày kỹ thuật |
| M2 — Identity | 4 | M1 | 4–6 ngày |
| M3 — Work core | 5–7 | M1, M2 | 10–15 ngày |
| M4 — Time & insights | 8–9 | M3 | 6–9 ngày |
| M5 — Extended MVP | 10–11 | M3; storage ADR cho Task 10 | 7–10 ngày |
| M6 — Hardening/release | 12 | M2–M5 | 5–8 ngày |
| Phase 5 integration | theo vertical slices | endpoint tương ứng | 8–12 ngày |

Tổng sơ bộ: **45–67 ngày kỹ thuật** cho một kỹ sư; có thể song song hóa sau M1 nhưng migration, contract và security review cần một owner thống nhất. Ước lượng phải được cập nhật sau khi Phase 2 chốt đầy đủ repository contracts.

---

## Quality gates cho từng pull request

- [ ] Có test thất bại trước behavior change và test regression cho bug.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` xanh; integration/API tests liên quan xanh.
- [ ] Migration được review về lock, data loss, index và backward compatibility.
- [ ] Endpoint mới có OpenAPI request/response/error examples và authorization matrix.
- [ ] Không log secret/PII; không có query thiếu workspace scope.
- [ ] `git diff --check` sạch; docs và `docs/delivery/PROGRESS_CHECKLIST.md` được cập nhật nếu acceptance criterion thay đổi.

## Definition of Done toàn backend

- [ ] Tất cả Backend MVP modules có API contract versioned, test và authorization theo workspace.
- [ ] Core flows login → project → task/Kanban → timer → report chạy E2E bằng PostgreSQL thật.
- [ ] Attachment dùng signed URL và storage production đã được review bảo mật.
- [ ] Error/log/metric/alert có requestId xuyên suốt; không lộ stack hoặc secret.
- [ ] Migration, backup/restore, deployment và rollback runbook đã được diễn tập trên staging.
- [ ] Frontend có thể chuyển từng repository từ local sang API mà không đổi public route hoặc business behavior.

---

## Rủi ro cần theo dõi

| Rủi ro | Giảm thiểu |
|---|---|
| Contract frontend mock lệch domain backend | Contract mapping trước code, OpenAPI compatibility test, tích hợp theo vertical slice |
| IDOR/cross-workspace leak | Workspace-scoped repository helpers, guard/policy và negative integration tests |
| Race condition Kanban/timer | DB constraint, transaction/locking, concurrency và idempotency tests |
| Migration gây downtime/data loss | Forward-only, expand/contract, staging rehearsal, backup + restore drill |
| Render cold start/DB exhaustion | Readiness, pool limit, timeout, metric/alert và benchmark staging |
| Upload độc hại/orphan | Signed URL ngắn hạn, MIME/magic-byte check, size limit, scan và cleanup job |
| Scope MVP phình | Giữ modular monolith; hoãn realtime, enterprise RBAC, notification nâng cao |
