# Test and security strategy

The backend test pyramid is executable in CI: pure unit tests for rules and policies; PostgreSQL-backed repository/invariant tests; Supertest HTTP acceptance tests; shared contract tests and OpenAPI drift checks. The database suite covers the core auth → workspace/project → task → timer → upload-intent path.

| Risk | Automated evidence |
| --- | --- |
| IDOR/workspace leakage | workspace isolation, task, analytics and attachment database suites |
| Injection/search abuse | strict Zod search bounds, parameterized Prisma queries and analytics acceptance test |
| Auth abuse/token replay | auth rate-limit, session rotation and password-reset lifecycle tests |
| CSRF/CORS | CSRF unit tests and bootstrap CORS integration tests |
| Upload spoofing/path traversal | magic-byte, namespace and attachment lifecycle tests |
| Oversized/abusive requests | explicit 1 MiB JSON/form limit, global IP budget and stricter auth identity budget |

CI uses a clean PostgreSQL service, applies forward migrations, and never runs seeds. Release evidence retains test summaries, dependency scan results, image digest, migration status and smoke output.
