import { Module } from '@nestjs/common';

import { AnalyticsModule } from './analytics/analytics.module';
import { AttachmentModule } from './attachments/attachment.module';

import { AuthModule } from './auth/auth.module';
import { DocumentModule } from './documents/document.module';
import { CommentModule } from './comments/comment.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { ObservabilityModule } from './observability/observability.module';
import { ProjectModule } from './projects/project.module';
import { ProfileModule } from './profile/profile.module';
import { ProductivityModule } from './productivity/productivity.module';
import { TaskModule } from './tasks/task.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { WorkspaceModule } from './workspaces/workspace.module';

@Module({
  imports: [AnalyticsModule, AttachmentModule, DatabaseModule, ObservabilityModule, AuthModule, AuthorizationModule, WorkspaceModule, ProjectModule, ProfileModule, DocumentModule, ProductivityModule, TaskModule, CommentModule, TimeTrackingModule],
  controllers: [HealthController]
})
export class AppModule {}
