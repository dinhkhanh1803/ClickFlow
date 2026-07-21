# Hướng dẫn deploy ClickFlow lên server free

Tài liệu này dành cho người mới deploy lần đầu. Mục tiêu là đưa ClickFlow lên môi trường online có thể test thật với PostgreSQL, Google login, gửi email xác thực và upload attachment qua Cloudflare R2.

## 1. Kiến trúc deploy khuyến nghị

Combo free/tiết kiệm phù hợp nhất cho ClickFlow:

- Database: Neon free hoặc Render PostgreSQL.
- API NestJS: Render Web Service bằng Docker.
- Web Next.js: Vercel free.
- File storage: Cloudflare R2.
- Email xác thực: Gmail App Password hoặc SMTP provider khác.

Luồng deploy:

```text
GitHub repo
  ├─ Render: API tại https://clickflow-api-xxx.onrender.com
  ├─ Neon/Render: PostgreSQL
  ├─ Vercel: Web tại https://clickflow-web-xxx.vercel.app
  └─ Cloudflare R2: private bucket lưu attachment
```

## 2. Chuẩn bị tài khoản/dịch vụ

Bạn cần có:

- GitHub: chứa source code ClickFlow.
- Render: deploy API.
- Vercel: deploy frontend Next.js.
- Neon hoặc Render PostgreSQL: database.
- Cloudflare: tạo R2 bucket lưu file.
- Google Cloud Console: OAuth Client cho Google login.
- Gmail có bật 2-Step Verification để tạo App Password gửi email.

## 3. Tạo PostgreSQL

### Cách A: Neon free

1. Vào Neon.
2. Tạo project PostgreSQL mới.
3. Copy connection string dạng:

```text
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

4. Dùng chuỗi này làm `DATABASE_URL` cho API.

### Cách B: Render PostgreSQL

1. Vào Render Dashboard.
2. Chọn New → PostgreSQL.
3. Tạo database, ví dụ:

```text
Name: clickflow-postgres
Database: clickflow
User: clickflow
Region: gần server API nhất
Plan: free nếu tài khoản còn hỗ trợ, hoặc gói thấp nhất
```

4. Nếu API cũng chạy trên Render, ưu tiên dùng Internal Database URL.
5. Nếu API chạy nơi khác, dùng External Database URL.

## 4. Tạo Cloudflare R2 bucket

1. Vào Cloudflare Dashboard.
2. Mở R2 Object Storage.
3. Tạo bucket, ví dụ:

```text
clickflow-attachments
```

4. Giữ bucket private. Không bật public bucket cho attachment.
5. Vào R2 → Manage R2 API Tokens.
6. Tạo API token có quyền đọc/ghi object cho bucket.
7. Copy các giá trị:

```bash
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=clickflow-attachments
```

ClickFlow dùng signed URL nên client upload trực tiếp lên R2, còn API chỉ ký URL và verify metadata.
### CORS cho R2 bucket

Vì browser upload trực tiếp lên signed URL của R2, bucket cần CORS cho domain web. Trong Cloudflare R2 bucket settings, thêm rule tương tự:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-clickflow-web.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Khi đổi domain web production, nhớ cập nhật `AllowedOrigins`.

## 5. Deploy API lên Render

Repo đã có [render.yaml](../../render.yaml), có thể dùng Render Blueprint.

### Cách nhanh bằng Blueprint

1. Push code lên GitHub.
2. Vào Render Dashboard.
3. New → Blueprint.
4. Chọn repo ClickFlow.
5. Render đọc `render.yaml` và tạo service.

### Cách thủ công

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

## 6. Biến môi trường cho API

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

STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=clickflow-attachments

API_RATE_LIMIT=300
API_RATE_WINDOW_MS=60000
AUTH_RATE_LIMIT=5
AUTH_RATE_WINDOW_MS=900000
QUERY_TIMEOUT_MS=10000
```

Không commit các giá trị thật vào Git.

Tạo JWT secret nhanh trên máy local:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Chạy 2 lần để lấy 2 chuỗi khác nhau cho `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET`.

## 7. Chạy migration database production/staging

Sau khi API deploy xong, chạy schema Prisma.

Render Shell trong API service:

```bash
cd apps/api
pnpm exec prisma migrate deploy
```

Hoặc chạy từ máy local, trỏ tới database staging/production:

```bash
cd apps/api
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public" pnpm exec prisma migrate deploy
```

Windows PowerShell:

```powershell
cd apps/api
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
pnpm exec prisma migrate deploy
```

Chỉ dùng `prisma migrate deploy` cho server. Không dùng `prisma migrate dev` trên production.

## 8. Deploy Web lên Vercel

1. Vào Vercel Dashboard.
2. Add New → Project.
3. Import repo ClickFlow.
4. Framework chọn Next.js.
5. Root Directory chọn:

```text
apps/web
```

6. Install command:

```bash
pnpm install --frozen-lockfile
```

7. Build command:

```bash
pnpm build
```

Nếu Vercel không tự nhận monorepo đúng, đổi build command thành:

```bash
cd ../.. && pnpm --filter web build
```

nhưng ưu tiên Root Directory là `apps/web` trước.

## 9. Biến môi trường cho Web

Trong Vercel → Project → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-clickflow-api.onrender.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=google-web-client-id.apps.googleusercontent.com
```

Sau khi đổi env, redeploy web.

## 10. Cấu hình Google OAuth

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

Nếu web hoặc API có domain riêng, thêm domain tương ứng vào Google OAuth.

## 11. Cấu hình Gmail App Password

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

Nếu Gmail chặn gửi mail, dùng SMTP provider như Resend, Brevo hoặc Mailgun.

## 12. Test sau deploy

Kiểm tra API health:

```bash
curl https://your-clickflow-api.onrender.com/api/v1/health/ready
```

Kết quả mong đợi là HTTP 200.

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

## 14. Lỗi thường gặp

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

### Upload Cloudflare R2 báo 403 hoặc complete báo lỗi

Kiểm tra API env:

```bash
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

Kiểm tra thêm:

- R2 token có quyền đọc/ghi object trong bucket.
- Bucket name trong env đúng tuyệt đối.
- API đã redeploy sau khi đổi env.
- Browser upload request dùng method `PUT`.

### Database chưa có bảng

Chạy:

```bash
cd apps/api
pnpm exec prisma migrate deploy
```

với `DATABASE_URL` trỏ đúng database server.

## 15. Thứ tự deploy an toàn

1. Push code lên GitHub.
2. Tạo PostgreSQL.
3. Tạo Cloudflare R2 bucket + token.
4. Deploy API.
5. Set API env.
6. Chạy `prisma migrate deploy`.
7. Deploy Web.
8. Set Web env.
9. Cập nhật Google OAuth origins/redirect URIs.
10. Test health API.
11. Test đăng ký/login/upload.
12. Chạy E2E thật.

Nếu bước nào lỗi, ưu tiên xem log ở Render API trước, vì phần lớn lỗi production ban đầu nằm ở env, database migration hoặc R2 credentials.