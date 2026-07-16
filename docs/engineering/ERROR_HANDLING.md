# Error Handling

Không rò rỉ stack trace cho client. Exception được chuẩn hóa thành error code, message an toàn, details validation và requestId. Lỗi domain trả 4xx; lỗi không mong đợi trả 500 và được log. Frontend hiển thị loading, empty, retryable error và trạng thái quyền truy cập rõ ràng.
