import { Body, Controller, Inject, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../authorization/authenticated-user';
import { CurrentUser } from '../authorization/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UserResponseDto } from '../auth/auth.dto';
import { ProfileService } from './profile.service';
import { updateProfileSchema, type UpdateProfileInput } from './profile.schemas';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(@Inject(ProfileService) private readonly profile: ProfileService) {}
  @Patch()
  @ApiOkResponse({ type: UserResponseDto })
  update(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(updateProfileSchema)) input: UpdateProfileInput) {
    return this.profile.update(user.id, input);
  }
}
