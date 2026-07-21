UPDATE "task_statuses" AS status
SET "name" = 'Open',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE status."name" = 'To do'
  AND status."category" = 'NOT_STARTED'
  AND status."position" = 0
  AND NOT EXISTS (
    SELECT 1
    FROM "task_statuses" AS existing
    WHERE existing."workspaceId" = status."workspaceId"
      AND existing."scopeType" = status."scopeType"
      AND existing."scopeId" = status."scopeId"
      AND existing."name" = 'Open'
  );
