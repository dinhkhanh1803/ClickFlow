# Database Design Plan

UUID là primary key; foreign key biểu đạt ownership; unique gồm membership `(workspaceId,userId)`, task tag `(taskId,tagId)` và status name trong project. Index cho workspace/project/status/assignee/deadline, search và time range. Dùng `createdAt`, `updatedAt`, optional `deletedAt`, `archivedAt`; lưu timestamp UTC, chuyển đổi ở client. Transaction bao phủ đổi status + activity và stop timer + time entry. Migration tuần tự, review trước deploy; backup/restore được kiểm thử và retention tuân theo chính sách hạ tầng.
