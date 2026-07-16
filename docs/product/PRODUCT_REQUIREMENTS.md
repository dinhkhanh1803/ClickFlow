# Product Requirements

## Mục tiêu

Quản lý workspace, project, task, tiến độ, thời gian và tài liệu bàn giao trong một sản phẩm web.

## Yêu cầu

Functional requirements theo [MVP scope](MVP_SCOPE.md): xác thực, dự án, task/subtask/checklist, view, tìm kiếm, time tracking, attachment/comment/activity, template, report, archive, settings. Non-functional: TypeScript strict, responsive, accessible, bảo mật token/dữ liệu, auditability, timezone rõ ràng.

## Giả định và giới hạn

Giai đoạn đầu có một tài khoản; data model phải hỗ trợ multi-user. Phụ thuộc Next.js, NestJS, PostgreSQL và nhà cung cấp storage trong tương lai. Billing, AI, chat và realtime không thuộc phạm vi. Chấp nhận sản phẩm khi các module MVP thỏa acceptance criteria trong [user stories](USER_STORIES.md).
