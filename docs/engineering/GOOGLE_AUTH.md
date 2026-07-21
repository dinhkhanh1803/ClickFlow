# Google authentication

## Contract

The browser uses Google Identity Services with `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Google returns an ID token in the `credential` field. The browser sends only that credential to `POST /api/v1/auth/google`; the Google client secret is never exposed to the browser.

The API verifies the token with Google's Node.js auth library and requires a valid signature, issuer, expiry, configured audience, subject, email, and `email_verified=true`. The Google `sub` claim is the stable external identity key; email is profile and account-discovery data only.

## Account decisions

1. A known `(GOOGLE, sub)` signs in to its linked ClickFlow user, even if the Google email later changes.
2. An unused verified Google email creates a ClickFlow user, an owner Workspace, an external identity, and the initial rotating session in one transaction.
3. An existing Gmail address, or an existing Google Workspace address with an `hd` claim, can be linked automatically because Google is authoritative for that address.
4. An existing third-party address without `hd` is not linked automatically. Google sign-in is rejected for that account and the user continues with password authentication.
5. Archived users cannot authenticate. Google display name and avatar initialize a new profile but never overwrite an existing profile.

Successful Google authentication issues the same short-lived access token, rotating refresh cookie, CSRF cookie, and audit events as password authentication. Invalid credentials are rate-limited and never logged.

## Configuration

- API: `GOOGLE_CLIENT_ID`
- Web: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with the same Web application client ID
- Google Console authorized JavaScript origins must include the exact web origin, such as `http://localhost:3000` in local development.

`GOOGLE_CLIENT_SECRET` is not required for the GIS ID-token popup flow. It must not be copied into any `NEXT_PUBLIC_*` variable.
