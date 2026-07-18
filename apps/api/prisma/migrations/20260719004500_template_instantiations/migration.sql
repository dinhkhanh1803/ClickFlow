CREATE TABLE "template_instantiations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "templateId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "template_instantiations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "template_instantiations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_instantiations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "template_instantiations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "template_instantiations_workspaceId_idempotencyKey_key" ON "template_instantiations"("workspaceId", "idempotencyKey");
CREATE INDEX "template_instantiations_templateId_createdAt_idx" ON "template_instantiations"("templateId", "createdAt");
