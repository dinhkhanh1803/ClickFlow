# Domain Model

User sở hữu Workspace; WorkspaceMember tạo đường mở rộng multi-user. Workspace có Project; Project có ProjectStatus, Section, Task, Milestone và ProjectTemplate. Task liên kết TaskStatus, parent Task, ChecklistItem, Tag qua TaskTag, Comment, Attachment, TimeEntry và ActivityLog. Notification là kết quả domain cho tương lai. Quan hệ và invariants xem [business rules](../product/BUSINESS_RULES.md); Phase 0 không có Prisma schema.
