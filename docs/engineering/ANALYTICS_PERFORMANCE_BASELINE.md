# Analytics performance baseline

Task 9 introduces workspace-scoped dashboard, project/task search and time/progress reports.

## Semantics and budgets

- Report ranges are half-open `[from,to)` and aggregated by UTC calendar day. Responses include the aggregation timezone; the frontend formats timestamps using the workspace timezone.
- Search is validated to 2–120 characters, uses parameterized Prisma filters, excludes archived records by default, ranks exact/prefix/contains matches, and paginates the merged project/task result.
- Initial staging SLO (excluding cold starts): p95 reads below 300 ms and mutations below 500 ms. Alert after three consecutive five-minute windows above budget.

## Query baseline

Run representative plans after loading a staging-sized fixture:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, "projectId", "updatedAt"
FROM tasks
WHERE "workspaceId" = $1 AND "archivedAt" IS NULL
  AND title ILIKE '%' || $2 || '%'
ORDER BY "updatedAt" DESC
LIMIT 20;
```

Local PostgreSQL baseline on 2026-07-19: planning 0.424 ms, execution 0.163 ms, Limit root node, 0 matching rows after acceptance-fixture cleanup. This validates query shape only; staging must repeat with representative volume.

Record row count, planning/execution time, buffers and PostgreSQL version with the release evidence. Existing workspace/archive/update and workspace/name indexes cover dashboard/report scoping. The unanchored `ILIKE` query is intentionally left without a new index until a representative `EXPLAIN ANALYZE` demonstrates a bottleneck; at that point prefer a measured `pg_trgm` GIN index. Do not introduce caching until correctness and workspace invalidation are specified.
