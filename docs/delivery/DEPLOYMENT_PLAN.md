# Deployment Plan

Frontend dự kiến Vercel; API và PostgreSQL dự kiến Render; storage chọn ở phase upload. Secrets nằm trong provider environment, không commit. Deploy gồm migration được review, health check, monitoring, backup verification và rollback plan. Chưa có deployment thật ở Phase 0.
