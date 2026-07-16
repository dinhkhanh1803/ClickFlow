# Thiết kế Phase 1 — ClickFlow Frontend Foundation

## Mục tiêu

Khởi tạo frontend foundation có thể chạy cho ClickFlow: Next.js, TypeScript, Tailwind, shadcn/ui, quality tooling, design system, application shell, mock routes, mock domain data và authentication UI. Backend, API client và persistence không thuộc phase này.

## Visual direction

Light-first productivity UI lấy cảm hứng từ mẫu được cung cấp: nền neutral rất nhạt, card trắng bo góc vừa, primary indigo `#6366F1`, secondary `#7B68EE`, tertiary `#B95F00`. Hanken Grotesk dùng cho heading, Inter cho body, JetBrains Mono cho label/số liệu. Dark mode dùng cùng semantic tokens, tôn trọng system preference và cho phép đổi thủ công.

## Kiến trúc

`apps/web` là Next.js App Router. Layout có providers cho theme và TanStack Query; route group `(app)` dùng application shell, `(auth)` dùng auth split layout. Presentation components chỉ dùng mock data/type từ `packages/contracts`; chưa gọi network. UI primitives nằm ở `packages/ui` khi tái sử dụng được, còn composition thuộc web app.

## Trải nghiệm

Desktop có sidebar cố định, top bar, search placeholder và action. Tablet/mobile thu gọn sidebar thành drawer. Route shells cho Dashboard, My Tasks, Calendar, Time Tracking, Projects, Templates, Reports, Archive và Settings đều có accessible heading cùng loading/empty/error states. Login, forgot-password và reset-password là mock flow, không gửi thông tin ra ngoài.

## Chất lượng

Strict TypeScript, ESLint, Prettier, Vitest/Testing Library, Playwright smoke test, import boundaries và GitHub Actions lint/typecheck/test/build. `.env.example` chỉ nêu public mock variables, không chứa secrets. Mọi interactive control có semantic label, visible focus và keyboard operation.

## Không thuộc phạm vi

Không API request, backend/authentication thật, database, upload, CRUD thực, drag-drop Kanban, report thực tế, deployment production hay CI deploy.
