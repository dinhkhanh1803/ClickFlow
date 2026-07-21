ALTER TABLE "task_statuses"
ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

UPDATE "task_statuses"
SET "is_system" = true
WHERE ("name" = 'Open' AND "category" = 'NOT_STARTED')
   OR ("name" = 'In progress' AND "category" = 'ACTIVE')
   OR ("name" = 'Complete' AND "category" = 'CLOSED');
