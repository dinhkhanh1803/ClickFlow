# Authentication Plan

Email/password dùng hash mạnh; access token ngắn hạn và refresh token có rotation/revocation. Logout thu hồi session; forgot/reset password dùng token một lần, hết hạn. Chống brute force và rate limit. Ưu tiên refresh token trong cookie `HttpOnly`, `Secure`, `SameSite` phù hợp; CSRF protection áp dụng với cookie, XSS giảm bằng CSP và không lưu secret ở client. Giai đoạn đầu giới hạn một user theo policy ứng dụng nhưng data model không khóa khả năng multi-user.
