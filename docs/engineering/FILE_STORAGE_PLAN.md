# File Storage Plan

Storage provider là abstraction với upload, download URL, delete và metadata; provider có thể là Cloudinary, R2, S3 hoặc Supabase Storage. API chỉ lưu metadata/key, xác thực quyền trước signed URL; giới hạn size/type, quét malware theo khả năng provider và dọn orphan upload. Chưa tích hợp provider ở Phase 0.
