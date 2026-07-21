CREATE TYPE "WorkspacePublicAccess" AS ENUM ('VIEW', 'EDIT');

ALTER TABLE "workspaces"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "publicAccess" "WorkspacePublicAccess" NOT NULL DEFAULT 'VIEW';
