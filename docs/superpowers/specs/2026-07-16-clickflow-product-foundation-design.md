# Thiết kế Phase 0 — ClickFlow Product Foundation

## Mục tiêu

Thiết lập nền móng tài liệu và cấu trúc monorepo cho ClickFlow, ứng dụng quản lý dự án cá nhân dành cho freelancer/solo developer. Phase này không tạo mã frontend, backend, Prisma schema, migration hay hạ tầng triển khai.

## Phương án đã chọn

Sử dụng pnpm workspace và Turborepo với các application/package chỉ chứa README mô tả trách nhiệm. Tài liệu được phân tách theo bốn nhóm: product, engineering, delivery và ADR. GitHub templates cùng các cấu hình root tạo quy ước làm việc nhất quán từ Phase 1.

Phương án này được chọn thay vì (1) một tài liệu tổng hợp duy nhất, vốn khó duy trì và truy vết quyết định, hoặc (2) khởi tạo ngay Next.js/NestJS, vốn vi phạm phạm vi Phase 0.

## Kiến trúc và luồng thông tin

`apps/web` sẽ là Next.js frontend trong phase sau; `apps/api` sẽ là NestJS REST API. Các package dùng chung gồm contracts, UI, cấu hình ESLint/TypeScript và shared utilities. Ở Phase 0, các ranh giới này chỉ là hợp đồng tổ chức; chưa có mã nguồn thực thi.

Các tài liệu product xác định nhu cầu và quy tắc nghiệp vụ. Tài liệu engineering chuyển chúng thành hướng kiến trúc, domain, database, API, xác thực, bảo mật và kiểm thử. Tài liệu delivery quản lý roadmap, backlog, rủi ro và tiêu chuẩn sẵn sàng/hoàn thành. ADR lưu các quyết định nền tảng.

## Kiểm soát lỗi và chất lượng

Tệp JSON/YAML sẽ được kiểm tra cú pháp; liên kết Markdown nội bộ, nội dung nhạy cảm, generated source và tính nhất quán tên ClickFlow sẽ được rà soát. README trong mọi thư mục tạo ra sẽ tránh thư mục rỗng. Cấu hình không khai báo dependency hay scripts không thể chạy.

## Ranh giới phạm vi

MVP được đặc tả, không được triển khai. Billing, AI assistant, realtime collaboration, team chat, native mobile và enterprise permissions nằm ngoài MVP. Mọi thương hiệu, nhánh và thông điệp commit được đổi từ DevFlow thành ClickFlow.

## Quyết định mở

Nhà cung cấp object storage, chính sách token/cookie chi tiết, phiên bản dependency và ngày review ADR sẽ được xác nhận khi bắt đầu các phase tương ứng.
