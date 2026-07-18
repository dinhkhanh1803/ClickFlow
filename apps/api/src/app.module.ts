import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { ObservabilityModule } from './observability/observability.module';
import { ProjectModule } from './projects/project.module';
import { TaskModule } from './tasks/task.module';
import { WorkspaceModule } from './workspaces/workspace.module';

@Module({
  imports: [DatabaseModule, ObservabilityModule, AuthModule, AuthorizationModule, WorkspaceModule, ProjectModule, TaskModule],
  controllers: [HealthController]
})
export class AppModule {}
