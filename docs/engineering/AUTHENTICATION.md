# Authentication and session lifecycle

ClickFlow uses short-lived HS256 access tokens and opaque rotating refresh tokens. Passwords are hashed with Argon2id. Only refresh-token hashes and password-reset-token hashes are persisted.

## HTTP contract

- `POST /api/v1/auth/register` creates the user, their first workspace, owner membership and session in one transaction.
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
- `MailAdapter` is an injectable boundary. `FakeMailAdapter` is the local/test implementation; production deployment must replace the provider with its configured mail transport.

## Configuration

`JWT_ACCESS_SECRET` must contain at least 32 characters in production. Other controls are `JWT_ACCESS_EXPIRES_IN_SECONDS`, `JWT_REFRESH_EXPIRES_IN_SECONDS`, `PASSWORD_RESET_EXPIRES_IN_SECONDS`, `AUTH_RATE_LIMIT`, `AUTH_RATE_WINDOW_MS`, `WEB_URL` and the existing CORS allowlist.
