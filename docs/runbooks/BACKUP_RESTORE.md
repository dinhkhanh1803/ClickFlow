# PostgreSQL backup and restore runbook

Owner: platform owner. Target policy is daily full backup plus provider point-in-time recovery, 30-day retention, encrypted at rest and restore access restricted to on-call leads. Initial objectives are RPO 24 hours and RTO 4 hours; replace these with measured results after the first staging drill.

Quarterly staging drill:

1. Record source backup identifier, UTC timestamp and expected row-count checksums.
2. Restore into a new isolated staging database; never overwrite the active database.
3. Apply `prisma migrate deploy`, run readiness, all database acceptance tests and sampled workspace/task/time totals.
4. Record actual data-loss window (RPO) and elapsed restore-to-ready time (RTO).
5. Destroy the isolated copy through the provider console after evidence review.

The production release gate remains closed until a successful drill has an owner, date, backup ID, measured RPO/RTO and linked evidence. Local migrations do not constitute restore proof.
