# Operations API — Task 12

Các endpoint public phục vụ orchestrator và monitoring:

| Method | Endpoint | Ý nghĩa |
| --- | --- | --- |
| `GET` | `/health/live` | Process đang chạy |
| `GET` | `/health/ready` | API và PostgreSQL sẵn sàng nhận traffic |
| `GET` | `/metrics` | Request/error/latency và PostgreSQL connection snapshot |

`ready` trả `503` khi PostgreSQL không khả dụng. Metrics hiện là JSON snapshot cơ bản; việc public endpoint ra Internet phải được giới hạn ở ingress/network policy của môi trường deploy.

Runtime áp dụng request ID, structured logging, redaction, query timeout, body limit 1 MiB, global rate limiting, Helmet và CORS allowlist. Quy trình deploy và incident nằm trong [`DEPLOYMENT_PLAN.md`](../delivery/DEPLOYMENT_PLAN.md) và [`INCIDENT_RESPONSE.md`](../runbooks/INCIDENT_RESPONSE.md).
