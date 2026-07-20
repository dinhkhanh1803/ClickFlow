CREATE TABLE "task_assignments" (
  "workspaceId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("taskId", "userId")
);

CREATE INDEX "task_assignments_workspaceId_userId_idx" ON "task_assignments"("workspaceId", "userId");

ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "task_assignments" ("workspaceId", "taskId", "userId")
SELECT "workspaceId", "id", "assigneeId" FROM "tasks" WHERE "assigneeId" IS NOT NULL
ON CONFLICT ("taskId", "userId") DO NOTHING;