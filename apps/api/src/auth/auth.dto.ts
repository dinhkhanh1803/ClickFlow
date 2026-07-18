import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({ type: String, format: 'email', example: 'owner@clickflow.local' }) email!: string;
  @ApiProperty({ type: String, minLength: 2, maxLength: 120, example: 'ClickFlow Owner' }) displayName!: string;
  @ApiProperty({ type: String, minLength: 10, maxLength: 128, format: 'password' }) password!: string;
}

export class LoginRequestDto {
  @ApiProperty({ type: String, format: 'email' }) email!: string;
  @ApiProperty({ type: String, format: 'password' }) password!: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({ type: String, format: 'email' }) email!: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ type: String }) token!: string;
  @ApiProperty({ type: String, minLength: 10, maxLength: 128, format: 'password' }) password!: string;
}

export class UserResponseDto {
  @ApiProperty({ type: String, format: 'uuid' }) id!: string;
  @ApiProperty({ type: String, format: 'email' }) email!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ type: String }) timezone!: string;
  @ApiProperty({ type: String }) locale!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: String }) accessToken!: string;
  @ApiProperty({ type: String, example: 'Bearer' }) tokenType!: 'Bearer';
  @ApiProperty({ type: Number, example: 900 }) expiresIn!: number;
  @ApiProperty({ type: String }) csrfToken!: string;
  @ApiProperty({ type: UserResponseDto }) user!: UserResponseDto;
}

export class AcceptedResponseDto {
  @ApiProperty({ type: Boolean, example: true }) accepted!: true;
}
