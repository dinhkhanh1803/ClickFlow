import { Global, Module } from '@nestjs/common';

import { DatabaseHealthService } from './database-health.service';
import { PrismaService } from './prisma.service';
import { WorkspaceTaskRepository } from './workspace-task.repository';

@Global()
@Module({
  providers: [PrismaService, DatabaseHealthService, WorkspaceTaskRepository],
  exports: [PrismaService, DatabaseHealthService, WorkspaceTaskRepository]
})
export class DatabaseModule {}
