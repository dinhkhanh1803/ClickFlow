# Backend release checklist

- [ ] Release owner and incident owner assigned; change window approved.
- [ ] CI green: frozen install, lint, typecheck, unit, contract, PostgreSQL acceptance, build, OpenAPI, migration status and security scan.
- [ ] Forward migration reviewed and applied as a separate staging step; seed was not run.
- [ ] N and N-1 application images confirmed compatible with schema N.
- [ ] Staging core E2E and smoke checks pass; image digest recorded.
- [ ] Uptime, 5xx, p95, DB connection and upload/job alerts send a test notification.
- [ ] Latest backup restore drill is within the quarter and meets recorded RPO/RTO.
- [ ] Production environment approval granted; canary observed for 15 minutes before full promotion.
- [ ] Post-deploy smoke passes and rollback decision window is closed by the release owner.
