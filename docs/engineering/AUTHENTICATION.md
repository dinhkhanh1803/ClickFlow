# Authentication and session lifecycle

ClickFlow uses short-lived HS256 access tokens and opaque rotating refresh tokens. Passwords are hashed with Argon2id. Only refresh, password-reset, and email-verification token hashes are persisted.

## HTTP contract

- POST /api/v1/auth/register-email creates an unverified email account and sends a one-time verification link.
- POST /api/v1/auth/verify-email consumes the verification token and activates email/password login.
- POST /api/v1/auth/resend-verification uniformly accepts requests for a fresh verification link.
- POST /api/v1/auth/register remains available for trusted integration/bootstrap flows and creates a verified session.
- `POST /api/v1/auth/login` returns an access token and sets the refresh/CSRF cookies.
- `POST /api/v1/auth/refresh` rotates the refresh token. Reusing an already-rotated token revokes every session in that token family.
- `POST /api/v1/auth/logout` revokes the current refresh session and clears both cookies.
- `POST /api/v1/auth/forgot-password` always returns `202 { "accepted": true }`, whether the email exists or not.
- `POST /api/v1/auth/reset-password` consumes a reset token once, changes the Argon2id hash and revokes all active sessions for the user.
- `GET /api/v1/users/me` requires `Authorization: Bearer <access-token>`.

The refresh token is stored in the `clickflow_refresh` cookie with `HttpOnly`, `SameSite=Lax`, an auth-only path and `Secure` in production. The readable `clickflow_csrf` cookie uses path `/` so the frontend can restore a session after reload; it must match the `x-csrf-token` header for refresh and logout.

## Security behavior

- Access tokens default to 15 minutes; refresh sessions default to 7 days; reset tokens default to 30 minutes.
- Register, login, forgot-password and reset-password are rate-limited by IP plus normalized identity. Reset tokens are hashed before becoming a rate-limit identity.
- Authentication failures use generic responses. Unknown login and reset identities are never written to logs; only a SHA-256 identity fingerprint is recorded.
- Audit events cover registration, login success/failure, refresh reuse, logout, reset request and completed reset. Raw passwords and tokens are excluded.
- `MailAdapter` is injectable. Development/test without `SMTP_HOST` uses `FakeMailAdapter`; configured environments use Nodemailer SMTP for verification and password-reset messages.

## Configuration

`JWT_ACCESS_SECRET` must contain at least 32 characters in production. Other controls are `JWT_ACCESS_EXPIRES_IN_SECONDS`, `JWT_REFRESH_EXPIRES_IN_SECONDS`, `PASSWORD_RESET_EXPIRES_IN_SECONDS`, `AUTH_RATE_LIMIT`, `AUTH_RATE_WINDOW_MS`, `EMAIL_VERIFICATION_EXPIRES_IN_SECONDS`, `WEB_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` (or their `SMTP_*` aliases) and the existing CORS allowlist.
