import { Global, Module } from '@nestjs/common';

import { WorkspaceMembershipGuard } from './workspace-membership.guard';
import { WorkspaceMembershipService } from './workspace-membership.service';

@Global()
@Module({
  providers: [WorkspaceMembershipService, WorkspaceMembershipGuard],
  exports: [WorkspaceMembershipService, WorkspaceMembershipGuard]
})
export class AuthorizationModule {}
