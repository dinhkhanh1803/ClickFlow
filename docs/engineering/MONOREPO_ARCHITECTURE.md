# Monorepo Architecture

Monorepo giữ contracts và cấu hình đồng bộ. `apps/web` chỉ phụ thuộc contracts/ui/shared; `apps/api` phụ thuộc contracts/shared; packages không phụ thuộc apps và cấm circular dependency. Turborepo sẽ điều phối build/test/lint có cache theo input; versioning nội bộ private cho đến khi có nhu cầu publish.
