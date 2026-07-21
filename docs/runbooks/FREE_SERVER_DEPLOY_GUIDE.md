# Hướng dẫn deploy ClickFlow lên server free

Tài liệu này dành cho người mới deploy lần đầu. Mục tiêu là đưa ClickFlow lên môi trường online có thể test thật với PostgreSQL, Google login, gửi email xác thực và upload attachment qua Cloudinary.

## 1. Kiến trúc deploy khuyến nghị

Để tiết kiệm chi phí, dùng combo sau:

- Database: Render PostgreSQL hoặc Neon free.
- API NestJS: Render Web Service bằng Docker.
- Web Next.js: Vercel free.
- File storage: Cloudinary.
- Email xác thực: Gmail App Password hoặc SMTP provider khác.

Repo hiện đã có `render.yaml` cho API + PostgreSQL trên Render, nên đường đi dễ nhất là:

```text
GitHub repo
  ├─ Render: chạy API tại https://clickflow-api-xxx.onrender.com
  ├─ Render/Neon: PostgreSQL
  └─ Vercel: chạy Web tại https://clickflow-web-xxx.vercel.app
```

## 2. Chuẩn bị tài khoản/dịch vụ

Bạn cần có:

- GitHub: chứa source code ClickFlow.
- Render: deploy API và có thể tạo PostgreSQL.
- Vercel: deploy frontend Next.js.
- Cloudinary: lưu ảnh, video, tài liệu attachment.
- Google Cloud Console: OAuth Client cho Google login.
- Gmail có bật 2-Step Verification để tạo App Password gửi email.

## 3. Deploy database PostgreSQL

### Cách A: Dùng Render PostgreSQL

1. Vào Render Dashboard.
2. Chọn New → PostgreSQL.
3. Tạo database, ví dụ:

```text
Name: clickflow-postgres
Database: clickflow
User: clickflow
Region: gần server API nhất
Plan: Free nếu tài khoản còn hỗ trợ free PostgreSQL, hoặc gói thấp nhất
```

4. Sau khi tạo xong, copy `Internal Database URL` nếu API cũng chạy trên Render.
5. Nếu API chạy nơi khác, dùng `External Database URL`.

### Cách B: Dùng Neon free

1. Vào Neon.
2. Tạo project PostgreSQL mới.
3. Copy connection string dạng:

```text
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

4. Dùng chuỗi này làm `DATABASE_URL` cho API.

## 4. Deploy API lên Render

### Cách nhanh bằng `render.yaml`

Repo đã có file [render.yaml](../../render.yaml), Render có thể đọc file này để tạo service.

1. Push code lên GitHub.
2. Vào Render Dashboard.
3. New → Blueprint.
4. Chọn repo ClickFlow.
5. Render sẽ đọc `render.yaml`.
6. Kiểm tra service API và database được tạo.

Lưu ý: `render.yaml` hiện dùng Dockerfile tại:

```text
apps/api/Dockerfile
```

Health check:

```text
/api/v1/health/ready
```

### Cách tạo thủ công

Nếu không dùng Blueprint:

1. New → Web Service.
2. Chọn repo ClickFlow.
3. Runtime chọn Docker.
4. Dockerfile path:

```text
./apps/api/Dockerfile
```

5. Docker context:

```text
.
```

6. Health check path:

```text
/api/v1/health/ready
```

## 5. Biến môi trường cho API

Trong Render → API service → Environment, cấu hình:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public

JWT_ACCESS_SECRET=chuoi-random-it-nhat-32-ky-tu
JWT_REFRESH_SECRET=chuoi-random-khac-it-nhat-32-ky-tu
JWT_ACCESS_EXPIRES_IN_SECONDS=900
JWT_REFRESH_EXPIRES_IN_SECONDS=604800

WEB_URL=https://your-clickflow-web.vercel.app
CORS_ORIGIN=https://your-clickflow-web.vercel.app

GOOGLE_CLIENT_ID=google-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=google-client-secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=gmail-app-password
EMAIL_FROM=ClickFlow <your-email@gmail.com>

STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

API_RATE_LIMIT=300
API_RATE_WINDOW_MS=60000
AUTH_RATE_LIMIT=5
AUTH_RATE_WINDOW_MS=900000
QUERY_TIMEOUT_MS=10000
```

Không commit các giá trị thật vào Git.

Để tạo JWT secret nhanh trên máy local:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Chạy 2 lần để lấy 2 chuỗi khác nhau cho `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET`.

## 6. Chạy migration database production/staging

Sau khi API service deploy xong, database vẫn cần schema Prisma.

Nếu dùng Render Shell trong API service:

```bash
cd apps/api
pnpm exec prisma migrate deploy
```

Nếu Render image không có shell tiện dụng, chạy từ máy local nhưng trỏ tới database staging/production:

```bash
cd apps/api
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public" pnpm exec prisma migrate deploy
```

Trên Windows PowerShell:

```powershell
cd apps/api
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
pnpm exec prisma migrate deploy
```

Chỉ dùng `prisma migrate deploy` cho server. Không dùng `prisma migrate dev` trên production.

## 7. Deploy Web lên Vercel

1. Vào Vercel Dashboard.
2. Add New → Project.
3. Import repo ClickFlow.
4. Framework chọn Next.js.
5. Root Directory chọn:

```text
apps/web
```

6. Build command:

```bash
pnpm build
```

7. Install command:

```bash
pnpm install --frozen-lockfile
```

8. Output giữ mặc định của Next.js.

Nếu Vercel không tự nhận monorepo đúng, có thể dùng:

```bash
cd ../.. && pnpm --filter web build
```

nhưng ưu tiên để Root Directory là `apps/web` trước.

## 8. Biến môi trường cho Web

Trong Vercel → Project → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-clickflow-api.onrender.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=google-web-client-id.apps.googleusercontent.com
```

Sau khi đổi biến môi trường, redeploy web.

## 9. Cấu hình Google OAuth

Trong Google Cloud Console → Credentials → OAuth 2.0 Client IDs:

Authorized JavaScript origins:

```text
http://localhost:3000
https://your-clickflow-web.vercel.app
```

Authorized redirect URIs:

```text
http://localhost:3001/api/v1/auth/google/callback
https://your-clickflow-api.onrender.com/api/v1/auth/google/callback
```

Nếu web có domain riêng, thêm domain đó vào JavaScript origins.

Nếu API có domain riêng, thêm callback của domain API vào redirect URIs.

## 10. Cấu hình Gmail App Password

1. Vào Google Account.
2. Bật 2-Step Verification.
3. Vào App Passwords.
4. Tạo app password cho Mail.
5. Copy mật khẩu 16 ký tự.
6. Điền vào API env:

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=ClickFlow <your-email@gmail.com>
```

Nếu Gmail chặn gửi mail, ưu tiên dùng SMTP provider như Resend, Brevo, Mailgun. Khi đó đổi `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` theo provider.

## 11. Cấu hình Cloudinary

Trong Cloudinary Dashboard, copy:

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

API cần thêm:

```bash
STORAGE_PROVIDER=cloudinary
```

Sau khi deploy, test upload:

- Ảnh `.png`, `.jpg`.
- Tài liệu `.md`, `.pdf`.
- Video nhỏ `.mp4`.

Cloudinary free có giới hạn dung lượng/băng thông, nên tránh upload file quá lớn khi test.

## 12. Checklist sau deploy

Kiểm tra API health:

```bash
curl https://your-clickflow-api.onrender.com/api/v1/health/ready
```

Kết quả mong đợi là HTTP 200.

Kiểm tra web:

```text
https://your-clickflow-web.vercel.app
```

Test tay các luồng quan trọng:

- Đăng ký bằng email Gmail.
- Nhận email verify và verify account.
- Login email/password.
- Login Google.
- Tạo Space.
- Tạo Folder.
- Folder tự có List mặc định.
- Tạo Task.
- Assign user.
- Upload attachment ảnh/tài liệu/video.
- Preview attachment.
- Download/Open original attachment.
- Chuyển Space Public/Private và permission View/Edit.

## 13. Chạy E2E thật trước khi coi là sẵn sàng deploy

Máy local cần đang trỏ vào API và database thật/staging.

PowerShell:

```powershell
cd apps/web
$env:E2E_USER_EMAIL="test-user@example.com"
$env:E2E_USER_PASSWORD="your-test-password"
$env:PLAYWRIGHT_BASE_URL="https://your-clickflow-web.vercel.app"
$env:PLAYWRIGHT_SKIP_WEBSERVER="1"
node_modules\.bin\playwright.cmd test real-api-authenticated.spec.ts
```

Bash:

```bash
cd apps/web
export E2E_USER_EMAIL="test-user@example.com"
export E2E_USER_PASSWORD="your-test-password"
export PLAYWRIGHT_BASE_URL="https://your-clickflow-web.vercel.app"
export PLAYWRIGHT_SKIP_WEBSERVER="1"
./node_modules/.bin/playwright test real-api-authenticated.spec.ts
```

Không hardcode tài khoản/mật khẩu test vào source.

## 14. Các lỗi thường gặp

### Web gọi API bị CORS

Kiểm tra API env:

```bash
CORS_ORIGIN=https://your-clickflow-web.vercel.app
WEB_URL=https://your-clickflow-web.vercel.app
```

Sau đó redeploy API.

### Cookie login không lưu

Kiểm tra:

- API đang chạy `NODE_ENV=production`.
- Web dùng HTTPS.
- API `CORS_ORIGIN` đúng domain web.
- Frontend `NEXT_PUBLIC_API_URL` đúng domain API.

### Google login báo origin/client không hợp lệ

Kiểm tra Google Cloud Console:

- Web domain nằm trong Authorized JavaScript origins.
- API callback nằm trong Authorized redirect URIs.
- `GOOGLE_CLIENT_ID` ở API giống `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ở web.

### Upload Cloudinary báo 401

Kiểm tra:

```bash
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
STORAGE_PROVIDER=cloudinary
```

Sau khi sửa env phải redeploy API.

### Database chưa có bảng

Chạy:

```bash
cd apps/api
pnpm exec prisma migrate deploy
```

với `DATABASE_URL` trỏ đúng database server.

## 15. Thứ tự deploy an toàn

Làm theo thứ tự này để đỡ rối:

1. Push code lên GitHub.
2. Tạo PostgreSQL.
3. Deploy API.
4. Set API env.
5. Chạy `prisma migrate deploy`.
6. Deploy Web.
7. Set Web env.
8. Cập nhật Google OAuth origins/redirect URIs.
9. Test health API.
10. Test đăng ký/login/upload.
11. Chạy E2E thật.

Nếu bước nào lỗi, ưu tiên xem log ở Render API trước, vì phần lớn lỗi production ban đầu nằm ở env hoặc database migration.
