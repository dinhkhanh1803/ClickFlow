# Analytics API — Task 9

Tất cả endpoint yêu cầu Bearer token và quyền truy cập workspace.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `GET` | `/workspaces/{workspaceId}/dashboard` | Tổng hợp project/task, overdue và project health |
| `GET` | `/workspaces/{workspaceId}/search` | Tìm project/task trong một workspace |
| `GET` | `/workspaces/{workspaceId}/reports/time` | Tổng hợp time entries theo khoảng UTC |
| `GET` | `/workspaces/{workspaceId}/reports/progress` | Tổng hợp tiến độ project/task |

Search hỗ trợ query, pagination và archived filter theo schema OpenAPI. Report dùng khoảng thời gian UTC. Dashboard, search và report mặc định không đưa archived record vào kết quả và không truy cập dữ liệu workspace khác.

Performance assumptions và quy trình đo `EXPLAIN ANALYZE` nằm tại [`ANALYTICS_PERFORMANCE_BASELINE.md`](../engineering/ANALYTICS_PERFORMANCE_BASELINE.md).
