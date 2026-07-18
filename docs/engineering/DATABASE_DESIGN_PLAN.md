# Database design — Backend Task 2

## Decisions

- PostgreSQL là system of record và Prisma `6.19.1` được pin cho NestJS CommonJS runtime hiện tại.
- UI `Space`, `Folder` và `List` được lưu thành `Workspace`, `Project` và `Section`.
- `Document` được persist. Dashboard, whiteboard và form dùng metadata `WorkspaceNavigationItem` trong MVP.
- ID là PostgreSQL UUID. Timestamp dùng `timestamptz(3)` và API serialize thành ISO 8601 UTC.
- Business record mang `workspaceId` trực tiếp. Mọi service query/mutation đều scope theo workspace.
- Status dùng `TaskStatus(scopeType, scopeId)` để chia sẻ contract giữa workspace, project và section.
- Chỉ comment dùng `deletedAt`; resource có restore dùng `archivedAt`.

## Referential and deletion policy

- Xóa workspace cascade dữ liệu business thuộc workspace.
- Xóa user bị restrict khi còn sở hữu workspace hoặc authored record cần giữ; membership và session cascade.
- Xóa project cascade section và project content; project cha không thể bị xóa khi còn project con.
- Xóa task status bị restrict khi task còn tham chiếu; assignee và section tùy chọn trở thành null khi bị xóa.
- Activity log chỉ do hệ thống ghi và chỉ cascade theo workspace.

Cross-workspace relationship bị chặn bởi membership guard và predicate trong từng feature service. HTTP database suites
cho workspace/project, task, analytics và attachment kiểm tra IDOR bằng hai workspace độc lập; không duy trì repository mẫu
chỉ để phục vụ test.

## Index strategy

Migration hiện tại index workspace/project/section tree, task status và board order, assignee/due date, updated date,
time range, activity history và archive filter. PostgreSQL full-text hoặc trigram index được hoãn đến khi có dataset đại diện
và kết quả `EXPLAIN ANALYZE` chứng minh nhu cầu.

## Local migration and seed

Dùng database PostgreSQL local riêng; không chạy các command sau vào production:

```bash
pnpm --filter api prisma:migrate
SEED_USER_PASSWORD_HASH=<development-only-hash> pnpm --filter api prisma:seed
```

Seed dùng UUID cố định và upsert nên chạy lặp lại vẫn hội tụ. Password hash phải đến từ environment; không nhận plaintext.

Chỉ chạy database tests trên database disposable đã migrate:

```bash
DATABASE_INTEGRATION_TESTS=1 DATABASE_URL=<dedicated-test-url> pnpm --filter api test:database
```

## Migration release and recovery

- Migration trên shared environment là forward-only và chạy ở release step riêng trước application version mới.
- Trước production migration, tạo và kiểm tra PostgreSQL backup; review lock, destructive SQL và long index build.
- Application release phải tương thích schema N và N-1 trong rollout.
- Schema correction dùng migration bù mới; không sửa migration đã áp dụng.
- Restore vào instance mới, xác nhận migration status và chạy smoke test trước khi chuyển traffic.
