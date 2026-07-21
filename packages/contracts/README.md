# @clickflow/contracts

Package chứa schema Zod, request/response types và mapping domain dùng chung giữa API và frontend.

## Quy ước

- Mỗi nhóm endpoint có một file `*-api-contract.ts` và test tương ứng.
- `domain-contract.ts` chỉ giữ enum, type và mapping xuyên feature.
- `common-api-contract.ts` giữ error envelope, pagination và health response.
- Không đặt mock UI, fixture trình bày hoặc dữ liệu mẫu màn hình trong package này.
- `index.ts` chỉ là public export surface; application không import file nội bộ trực tiếp.

Chạy `pnpm --filter @clickflow/contracts typecheck` và `pnpm --filter @clickflow/contracts test` trước khi thay đổi contract.
