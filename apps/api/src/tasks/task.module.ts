import { Module } from '@nestjs/common';

import { TaskAccessoryService } from './task-accessory.service';
import { TagController, TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  controllers: [TaskController, TagController],
  providers: [TaskService, TaskAccessoryService]
})
export class TaskModule {}
