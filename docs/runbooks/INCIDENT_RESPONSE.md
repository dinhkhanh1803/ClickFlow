# API incident response

Owner: backend on-call. Severity 1 is sustained unavailability/data loss; severity 2 is elevated errors or latency; severity 3 is partial degradation.

1. Acknowledge within 10 minutes, open an incident channel and record UTC start time/deploy SHA.
2. Check uptime, 5xx ratio, p95 latency, PostgreSQL connections/saturation and failed attachment cleanup jobs. Correlate structured `requestId` logs.
3. Stop promotion. For an application regression, roll back to the N-1 image only if it is compatible with the forward-only N schema. Do not roll back migrations destructively.
4. For DB pressure, reject nonessential jobs, inspect slow queries and connection count; do not restart or terminate sessions blindly.
5. For storage failures, pause completion, preserve metadata, retry idempotent deletes and run orphan cleanup after recovery.
6. Confirm live/ready endpoints and core smoke flow, then monitor two healthy alert windows before resolution.
7. Publish a timeline and corrective actions within two business days.

Alert targets: uptime <99.9%, 5xx >2% for 5 minutes, p95 read >300 ms for 15 minutes, DB connections >80%, or cleanup/upload failures >5 in 10 minutes. Configure these monitors in Render and the selected metrics provider before production approval.
