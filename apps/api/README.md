# ClickFlow API

NestJS REST API cho ClickFlow. API dùng URI versioning với prefix `/api/v1`.

## Chạy local

1. Sao chép `.env.example` thành `.env` và chỉ điền secret trong môi trường local.
2. Chạy `pnpm --filter api dev`.
3. Kiểm tra `GET http://localhost:3001/api/v1/health/live`.

Swagger UI được phục vụ tại `http://localhost:3001/api/docs`; JSON runtime tại
`/api/docs/openapi.json`. Contract được commit tại `docs/api/openapi.json`.

## Quality gates

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api test`
- `pnpm --filter api test:integration`
- `pnpm --filter api build`
- `pnpm --filter api openapi:check`

`openapi:generate` cập nhật contract; `openapi:check` thất bại nếu artifact đã cũ.
Production bắt buộc có `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` dài tối thiểu 32 ký tự.
