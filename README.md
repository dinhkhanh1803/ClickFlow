# ClickFlow

ClickFlow là ứng dụng quản lý dự án và công việc cho freelancer hoặc solo developer, theo dõi vòng đời từ ý tưởng đến bảo trì. Sản phẩm giúp tập trung dự án web, mobile, game, content và internal tool trong một workspace.

## Trạng thái

Phase 0 — Product Foundation. Frontend và backend chưa được khởi tạo; không có hướng dẫn chạy ứng dụng ở giai đoạn này.

## MVP và kiến trúc dự kiến

MVP gồm xác thực, dự án/công việc, các view Kanban/List/Calendar, theo dõi thời gian, tệp đính kèm, bình luận, tìm kiếm, template, báo cáo cơ bản, archive và settings. Kiến trúc dự kiến: Next.js trên Vercel → NestJS REST API trên Render → PostgreSQL trên Render → object storage.

Monorepo dùng pnpm workspace và Turborepo: `apps/web`, `apps/api`, cùng `packages/contracts`, `ui`, `shared`, `eslint-config`, `typescript-config`.

## Phát triển

Các phase: Foundation, Frontend Foundation, Frontend Features, Backend Foundation, Backend Business Modules, Integration, Testing/Hardening, Deployment. Xem [roadmap](docs/delivery/DEVELOPMENT_ROADMAP.md) và [backlog](docs/delivery/BACKLOG.md).

Branch dùng `type/short-description`; commit dùng Conventional Commits. Xem [CONTRIBUTING.md](CONTRIBUTING.md), [tài liệu sản phẩm](docs/product/PRODUCT_VISION.md) và [kiến trúc](docs/engineering/SYSTEM_ARCHITECTURE.md).
