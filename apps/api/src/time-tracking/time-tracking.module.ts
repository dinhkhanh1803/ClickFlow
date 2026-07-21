import { Module } from '@nestjs/common';

import { TimeEntryController, TimerController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';

@Module({ controllers: [TimerController, TimeEntryController], providers: [TimeTrackingService] })
export class TimeTrackingModule {}
