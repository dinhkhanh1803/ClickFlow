# Deployment plan

Frontend remains on Vercel; API and PostgreSQL use Render, with private S3-compatible object storage. Secrets exist only in environment providers.

## Promotion

1. CI produces green quality, PostgreSQL acceptance, security and container evidence.
2. The release owner applies forward-only migrations as a separate staging job. Seeds are forbidden.
3. Deploy the immutable application image to staging, run the core E2E/smoke suite, verify alert test notifications and attach the latest restore-drill evidence.
4. Production requires GitHub environment approval and a staging evidence URL/SHA. Observe a 15-minute canary before full promotion.
5. Post-deploy smoke must pass. Application rollback may use image N-1 only when it is compatible with schema N; database migrations are never destructively rolled back.

The Render blueprint provisions staging with manual deploy. Production is intentionally not auto-provisioned from source; create it only after the release checklist is satisfied. Storage credentials, JWT secrets, deploy hooks and database URLs are never committed.
