ALTER TABLE "time_entries"
ADD COLUMN "startIdempotencyKey" TEXT,
ADD COLUMN "stopIdempotencyKey" TEXT;

CREATE UNIQUE INDEX "time_entries_userId_startIdempotencyKey_key"
ON "time_entries"("userId", "startIdempotencyKey");

CREATE UNIQUE INDEX "time_entries_userId_stopIdempotencyKey_key"
ON "time_entries"("userId", "stopIdempotencyKey");

CREATE UNIQUE INDEX "time_entries_one_running_per_user_key"
ON "time_entries"("userId")
WHERE "endedAt" IS NULL AND "archivedAt" IS NULL;
