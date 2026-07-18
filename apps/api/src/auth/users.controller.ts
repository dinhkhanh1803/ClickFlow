import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../authorization/current-user.decorator';
import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { UserResponseDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.auth.getCurrentUser(user);
  }
}
