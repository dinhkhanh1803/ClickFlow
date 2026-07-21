import { Module } from '@nestjs/common';

import { ProjectController } from './project.controller';
import { ProjectHealthService } from './project-health.service';
import { ProjectStructureService } from './project-structure.service';
import { ProjectService } from './project.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, ProjectHealthService, ProjectStructureService],
  exports: [ProjectService, ProjectHealthService, ProjectStructureService]
})
export class ProjectModule {}
