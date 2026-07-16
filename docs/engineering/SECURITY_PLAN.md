# Security Plan

Threat model gồm account takeover, IDOR, injection, XSS/CSRF, upload độc hại, secret leak và dependency compromise. Dùng authentication/authorization theo workspace, validation/ORM parameterization, output encoding/CSP, CSRF/CORS allowlist, rate limit/security headers, secret manager, upload scan/type limit và audit logging. Principle of least privilege áp dụng cho DB/storage/deploy; dependency scan và backup restore được lập lịch.
