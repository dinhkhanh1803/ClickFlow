# PostgreSQL cho người mới: thực hành với ClickFlow

Tài liệu này hướng dẫn dùng PostgreSQL 18 cài local trên Windows cho dự án ClickFlow. Nó ưu tiên thao tác an toàn: xem trước, sao lưu trước khi thay đổi, và không nhập mật khẩu vào lệnh, Git, ảnh chụp màn hình hoặc chat.

> Phạm vi: database local `clickflow`. Không dùng các lệnh thay đổi/xóa dữ liệu trong production.

## 1. Các khái niệm cần biết

| Khái niệm | Diễn giải đơn giản |
| --- | --- |
| PostgreSQL server | Dịch vụ lưu trữ dữ liệu đang chạy trên máy, mặc định ở cổng `5432`. |
| Database | Một vùng dữ liệu độc lập trong server, ví dụ `clickflow`. |
| Schema | Không gian chứa bảng; ClickFlow dùng schema mặc định là `public`. |
| Table | Bảng dữ liệu, ví dụ `users`, `projects`, `tasks`. |
| Row | Một dòng dữ liệu trong bảng. |
| Column | Một trường dữ liệu, ví dụ `email`, `createdAt`. |
| SQL | Ngôn ngữ để hỏi hoặc thay đổi dữ liệu. |
| `psql` | Công cụ dòng lệnh chính thức của PostgreSQL. |
| Prisma | Công cụ trong API ClickFlow, quản lý schema và migration. |
| Migration | Lịch sử thay đổi cấu trúc database, chẳng hạn tạo bảng hoặc thêm cột. |

## 2. Chuẩn bị terminal Git Bash

Mở Git Bash trong thư mục dự án:

```bash
cd /e/MyProjects/ClickFlow
```

Thêm PostgreSQL CLI vào `PATH` cho terminal hiện tại:

```bash
export PATH="/c/Program Files/PostgreSQL/18/bin:$PATH"
```

Kiểm tra công cụ:

```bash
psql --version
```

Kết quả dự kiến có dạng `psql (PostgreSQL) 18.x`.

> Lệnh `export` chỉ có hiệu lực cho terminal hiện tại. Mở terminal mới thì chạy lại lệnh này, hoặc cấu hình PATH Windows sau khi đã quen với PostgreSQL.

## 3. Đăng nhập và thoát `psql`

Đăng nhập database của ClickFlow và luôn yêu cầu nhập mật khẩu:

```bash
psql -U postgres -h localhost -p 5432 -d clickflow -W
```

| Tham số | Ý nghĩa |
| --- | --- |
| `-U postgres` | Dùng database user tên `postgres`. |
| `-h localhost` | Kết nối PostgreSQL trên máy hiện tại. |
| `-p 5432` | Cổng PostgreSQL mặc định. |
| `-d clickflow` | Chọn database ClickFlow. |
| `-W` | Bắt buộc hỏi mật khẩu. Khi gõ, terminal không hiển thị ký tự nào. |

Khi thấy `clickflow=#`, bạn đã vào được database. Thoát bằng:

```sql
\q
```

Các lệnh bắt đầu bằng `\` là lệnh riêng của `psql`; các lệnh kết thúc bằng `;` là SQL.

## 4. Khám phá database mà không thay đổi gì

Sau khi đăng nhập `psql`, dùng các lệnh sau.

```sql
\l
```

Liệt kê các database trên server.

```sql
\conninfo
```

Cho biết bạn đang kết nối server/database/user nào.

```sql
\dn
```

Liệt kê schema.

```sql
\dt
```

Liệt kê các bảng trong schema hiện tại (`public`).

```sql
\dt public.*
```

Liệt kê tất cả bảng trong schema `public`.

```sql
\d users
```

Xem cột, kiểu dữ liệu, index và khóa của bảng `users`. Thay `users` bằng `tasks`, `projects`, `workspaces` hoặc bảng khác.

```sql
\di
```

Liệt kê index.

```sql
\du
```

Liệt kê database users/roles.

## 5. Xem dữ liệu ClickFlow

Sau migration, các bảng quan trọng gồm `users`, `workspaces`, `workspace_members`, `projects`, `sections`, `task_statuses`, `tasks`, `comments`, `documents`, `attachments`, `time_entries` và `activity_logs`.

Ban đầu các truy vấn có thể trả về `0 rows`; migration tạo cấu trúc bảng, không tự tạo dữ liệu người dùng.

### Xem số dòng trong các bảng chính

```sql
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks;
```

### Xem người dùng an toàn

Không dùng `SELECT * FROM users` khi chia sẻ màn hình vì bảng có thể chứa `passwordHash`. Chỉ xem cột cần thiết:

```sql
SELECT id, email, "displayName", "emailVerifiedAt", "createdAt"
FROM users
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Xem workspace, project và task

```sql
SELECT id, name, private, "createdAt"
FROM workspaces
ORDER BY "createdAt" DESC
LIMIT 20;
```

```sql
SELECT id, name, "workspaceId", "deadline", "archivedAt"
FROM projects
ORDER BY "createdAt" DESC
LIMIT 20;
```

```sql
SELECT id, title, priority, "projectId", "statusId", "dueAt", "completedAt"
FROM tasks
ORDER BY "createdAt" DESC
LIMIT 20;
```

PostgreSQL phân biệt hoa/thường đối với tên cột được đặt trong dấu ngoặc kép. Vì thế các cột camelCase như `"createdAt"` và `"workspaceId"` cần dấu ngoặc kép.

### Kết nối dữ liệu giữa các bảng

```sql
SELECT
  t.title AS task_title,
  p.name AS project_name,
  s.name AS status_name,
  t.priority,
  t."dueAt"
FROM tasks AS t
JOIN projects AS p ON p.id = t."projectId"
JOIN task_statuses AS s ON s.id = t."statusId"
ORDER BY t."createdAt" DESC
LIMIT 50;
```

## 6. Viết truy vấn SQL cơ bản

### Đọc dữ liệu: `SELECT`

```sql
SELECT * FROM projects LIMIT 10;
SELECT name FROM workspaces;
SELECT title, priority FROM tasks WHERE priority = 'HIGH';
SELECT title FROM tasks WHERE "dueAt" IS NULL;
SELECT title FROM tasks ORDER BY "createdAt" DESC LIMIT 5;
```

Thứ tự tư duy là `SELECT` cột nào, `FROM` bảng nào, `WHERE` lọc gì, `ORDER BY` sắp xếp ra sao, `LIMIT` tối đa bao nhiêu dòng.

### Lọc: `WHERE`

```sql
SELECT * FROM tasks WHERE priority IN ('URGENT', 'HIGH');
SELECT * FROM tasks WHERE "completedAt" IS NOT NULL;
SELECT * FROM projects WHERE name ILIKE '%website%';
SELECT * FROM tasks WHERE "createdAt" >= NOW() - INTERVAL '7 days';
```

`ILIKE` tìm không phân biệt hoa/thường. Ký tự `%` đại diện cho bất kỳ chuỗi ký tự nào.

### Đếm và nhóm: `COUNT`, `GROUP BY`

```sql
SELECT priority, COUNT(*) AS task_count
FROM tasks
GROUP BY priority
ORDER BY task_count DESC;
```

```sql
SELECT "workspaceId", COUNT(*) AS project_count
FROM projects
GROUP BY "workspaceId";
```

### Kết nối bảng: `JOIN`

```sql
SELECT u.email, w.name AS workspace_name, wm.role
FROM workspace_members AS wm
JOIN users AS u ON u.id = wm."userId"
JOIN workspaces AS w ON w.id = wm."workspaceId"
ORDER BY w.name, u.email;
```

## 7. Thay đổi dữ liệu: chỉ dùng khi hiểu rõ

Giao diện ClickFlow hoặc API là cách ưu tiên để tạo và chỉnh dữ liệu. SQL trực tiếp bỏ qua validation, authorization và activity log của ứng dụng. Trước khi chạy `INSERT`, `UPDATE`, hoặc `DELETE`, hãy backup database.

### Xem trước trước khi `UPDATE` hoặc `DELETE`

```sql
SELECT id, title, priority
FROM tasks
WHERE id = 'UUID-CUA-TASK';
```

### Dùng transaction để có thể hủy

```sql
BEGIN;

UPDATE tasks
SET priority = 'HIGH'
WHERE id = 'UUID-CUA-TASK';

SELECT id, title, priority FROM tasks WHERE id = 'UUID-CUA-TASK';

ROLLBACK;
```

`ROLLBACK` hủy toàn bộ thay đổi trong transaction. Chỉ thay `ROLLBACK` bằng `COMMIT` khi đã kiểm tra kỹ.

### Tạo dữ liệu thủ công

ClickFlow có UUID, khóa ngoại, enum và các quy tắc nghiệp vụ. Không khuyến nghị tự `INSERT` user/workspace/task lúc mới học. Hãy tạo dữ liệu trong web app, sau đó dùng SQL để quan sát nó.

## 8. Prisma: schema và migration của ClickFlow

### Sinh Prisma Client

```bash
pnpm --filter api prisma:generate
```

Prisma đọc `apps/api/prisma/schema.prisma` và sinh code TypeScript để API truy cập database.

### Áp dụng migration có sẵn

```bash
pnpm --filter api prisma:migrate
```

Lệnh hiện tại của dự án chạy `prisma migrate dev`. Nó có thể hỏi tên migration mới nếu schema có thay đổi. Nếu bạn chỉ muốn chạy dự án và không chủ động sửa schema, nhấn `Ctrl + C` tại lời nhắc đó; không tự tạo migration mới.

### Xem database bằng Prisma Studio

```bash
pnpm --filter api exec prisma studio
```

Mở URL được in ra, thường là `http://localhost:5555`. Prisma Studio dễ dùng cho người mới: chọn bảng, xem dòng dữ liệu, lọc hoặc sửa dữ liệu local.

> Chỉ chạy Prisma Studio với local database. Không mở nó công khai ra internet hoặc dùng trực tiếp trên production database.

## 9. pgAdmin: giao diện đồ họa PostgreSQL

PostgreSQL trên Windows thường đi kèm pgAdmin 4. Mở Start Menu và tìm `pgAdmin 4`, sau đó đăng ký server local bằng thông tin:

| Trường | Giá trị |
| --- | --- |
| Host name/address | `localhost` |
| Port | `5432` |
| Maintenance database | `postgres` |
| Username | `postgres` |
| Password | Mật khẩu PostgreSQL local của bạn |

Trong pgAdmin, database nằm theo cây `Servers` → server PostgreSQL → `Databases` → `clickflow` → `Schemas` → `public` → `Tables`.

## 10. Sao lưu và khôi phục local database

### Tạo backup định dạng custom

Thoát `psql`, rồi chạy trong Git Bash:

```bash
mkdir -p backups
pg_dump -U postgres -h localhost -p 5432 -W -F c -f "backups/clickflow-$(date +%Y%m%d-%H%M%S).dump" clickflow
```

Lệnh tạo file backup `.dump` trong thư mục `backups/`. Không commit file backup vì có thể chứa dữ liệu cá nhân.

### Xem nội dung backup

```bash
pg_restore -l backups/ten-file.dump
```

### Khôi phục an toàn vào database mới

Không khôi phục đè database đang dùng. Tạo database thử nghiệm:

```bash
createdb -U postgres -h localhost -p 5432 -W clickflow_restore_test
pg_restore -U postgres -h localhost -p 5432 -W -d clickflow_restore_test backups/ten-file.dump
```

Kiểm tra database khôi phục:

```bash
psql -U postgres -h localhost -d clickflow_restore_test -W
```

## 11. Vận hành và chẩn đoán cơ bản

### Kiểm tra server có nhận kết nối

```bash
pg_isready -h localhost -p 5432 -U postgres
```

Kết quả tốt có `accepting connections`.

### Xem phiên kết nối đang mở

```sql
SELECT pid, usename, datname, state, query_start, query
FROM pg_stat_activity
WHERE datname = 'clickflow'
ORDER BY query_start DESC;
```

### Xem dung lượng database và bảng

```sql
SELECT pg_size_pretty(pg_database_size('clickflow')) AS database_size;
```

```sql
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Xem execution plan (chỉ đọc)

```sql
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE "workspaceId" = 'UUID-CUA-WORKSPACE';
```

`EXPLAIN ANALYZE` thực sự chạy query; dùng với `SELECT` nhỏ ở local. Không dùng bừa bãi với query nặng trên production.

## 12. Quản lý user và quyền

Tài khoản `postgres` là superuser local; không dùng nó làm tài khoản production. Khi đã quen, có thể tạo user riêng cho ứng dụng.

```sql
CREATE ROLE clickflow_app WITH LOGIN PASSWORD 'MAT_KHAU_RIENG';
GRANT CONNECT ON DATABASE clickflow TO clickflow_app;
```

Sau đó kết nối vào `clickflow` bằng `postgres` và cấp quyền schema/bảng:

```sql
GRANT USAGE, CREATE ON SCHEMA public TO clickflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clickflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clickflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clickflow_app;
```

Chỉ dùng phần này để học local. Thiết kế quyền production cần được review riêng.

## 13. Các lệnh nguy hiểm cần nhận diện

Các lệnh sau có thể xóa dữ liệu. Không chạy khi chưa hiểu hoặc chưa backup.

```sql
DELETE FROM tasks;
TRUNCATE TABLE tasks;
DROP TABLE tasks;
DROP DATABASE clickflow;
```

| Lệnh | Tác động |
| --- | --- |
| `DELETE` | Xóa các dòng thỏa điều kiện; quên `WHERE` sẽ xóa toàn bộ bảng. |
| `TRUNCATE` | Xóa nhanh toàn bộ dòng trong bảng. |
| `DROP TABLE` | Xóa bảng và dữ liệu của bảng. |
| `DROP DATABASE` | Xóa toàn bộ database. |

Trước mọi thao tác sửa/xóa: chạy `SELECT` để kiểm tra mục tiêu, tạo backup bằng `pg_dump`, và ưu tiên dùng `BEGIN` + `ROLLBACK` khi có thể.

## 14. Quy trình hằng ngày đề xuất

1. Mở Services và chắc `postgresql-x64-18` đang Running.
2. Mở Git Bash tại `/e/MyProjects/ClickFlow`.
3. Chạy `pnpm dev:api` ở terminal thứ nhất.
4. Chạy `pnpm dev` ở terminal thứ hai.
5. Tạo/sửa dữ liệu qua web app.
6. Xem dữ liệu qua Prisma Studio hoặc `psql` với `SELECT`.
7. Trước khi thử SQL thay đổi dữ liệu, tạo backup.

## 15. Bảng tra nhanh

| Mục tiêu | Lệnh |
| --- | --- |
| Kiểm tra PostgreSQL đang chạy | `pg_isready -h localhost -p 5432 -U postgres` |
| Vào database | `psql -U postgres -h localhost -d clickflow -W` |
| Liệt kê bảng | `\dt` |
| Mô tả bảng | `\d tasks` |
| Xem 10 task | `SELECT * FROM tasks LIMIT 10;` |
| Thoát `psql` | `\q` |
| Mở giao diện dữ liệu | `pnpm --filter api exec prisma studio` |
| Tạo backup | `pg_dump -U postgres -h localhost -W -F c -f backups/clickflow.dump clickflow` |
| Sinh Prisma Client | `pnpm --filter api prisma:generate` |

## 16. Khi cần trợ giúp

Khi gặp lỗi, gửi nguyên lệnh và phần lỗi, nhưng che toàn bộ password, `DATABASE_URL`, token, email thật và dữ liệu nhạy cảm. Với lỗi liên quan ClickFlow, cũng nêu rõ bạn đang chạy lệnh trong thư mục nào bằng:

```bash
pwd
```
