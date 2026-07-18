# ClickFlow API

NestJS REST API cho ClickFlow, dùng URI versioning với prefix `/api/v1`.

## Cấu trúc

- `src/<feature>`: controller, DTO, schema, service và business rules của từng vertical slice.
- `src/common`: middleware, filter, interceptor và utility dùng chung, không chứa business logic.
- `src/database`: Prisma lifecycle và database health.
- `src/bootstrap`: cấu hình HTTP application dùng chung cho runtime và integration test.
- `src/openapi`: tạo Swagger/OpenAPI trực tiếp từ runtime DTO.
- `test`: integration và PostgreSQL acceptance tests; unit tests đặt cạnh source tương ứng.
- `prisma`: schema, migrations và seed idempotent.
- `scripts`: các command vận hành nhỏ như smoke test.

## Chạy local

1. Sao chép `.env.example` thành `apps/api/.env` và chỉ điền secret local.
2. Chạy `pnpm --filter api prisma:generate` và `pnpm --filter api prisma:migrate`.
3. Chạy `pnpm --filter api dev`.
4. Kiểm tra `GET http://localhost:3001/api/v1/health/live`.

Swagger UI ở `http://localhost:3001/api/docs`; JSON runtime ở `/api/docs/openapi.json`.
Contract được commit tại `docs/api/openapi.json`.

## Quality gates

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`
- `pnpm --filter api test:integration`
- `pnpm --filter api test:database`
- `pnpm --filter api build`
- `pnpm --filter api openapi:check`

`openapi:generate` cập nhật contract; `openapi:check` thất bại khi artifact bị cũ.
Production bắt buộc có `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` dài tối thiểu 32 ký tự.
