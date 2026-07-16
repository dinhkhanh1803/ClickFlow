# Testing Strategy

Test pyramid ưu tiên unit cho business rules, integration cho persistence/API boundary, API/contract test cho REST, component test cho UI, E2E cho luồng quan trọng và smoke sau deploy. Regression bao phủ bug đã sửa; security và performance test tập trung auth, authorization, search, Kanban và upload. Phase 0 chỉ định chiến lược, chưa cài framework test.
