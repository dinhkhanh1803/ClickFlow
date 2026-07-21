import { Body, Controller, Headers, HttpCode, HttpStatus, Inject, Ip, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiAcceptedResponse, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthRateLimiterService } from './auth-rate-limiter.service';
import { AcceptedResponseDto, AuthResponseDto, EmailRegistrationResponseDto, ForgotPasswordRequestDto, GoogleLoginRequestDto, LoginRequestDto, RegisterRequestDto, ResendVerificationRequestDto, ResetPasswordRequestDto, VerifyEmailRequestDto } from './auth.dto';
import { forgotPasswordSchema, type ForgotPasswordInput, googleLoginSchema, type GoogleLoginInput, loginSchema, type LoginInput, registerSchema, type RegisterInput, resendVerificationSchema, type ResendVerificationInput, resetPasswordSchema, type ResetPasswordInput, verifyEmailSchema, type VerifyEmailInput } from './auth.schemas';
import { AuthService, type AuthClientContext, type AuthResult } from './auth.service';
import { clearAuthCookies, CSRF_COOKIE, parseCookies, REFRESH_COOKIE, writeAuthCookies } from './cookies';
import { CsrfService } from './csrf.service';
import { GoogleIdentityVerifier } from './google-identity.verifier';
import { Public } from './public.decorator';
import { TokenService } from './token.service';

function clientContext(request: Request, ipAddress: string): AuthClientContext {
  const requestWithId = request as Request & { requestId?: string };
  return {
    ipAddress,
    userAgent: request.header('user-agent')?.slice(0, 512),
    requestId: requestWithId.requestId
  };
}

function publicResult(result: AuthResult): AuthResponseDto {
  return {
    accessToken: result.accessToken,
    tokenType: result.tokenType,
    expiresIn: result.expiresIn,
    csrfToken: result.csrfToken,
    user: result.user
  };
}

@Public()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(AuthRateLimiterService) private readonly limiter: AuthRateLimiterService,
    @Inject(CsrfService) private readonly csrf: CsrfService,
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(GoogleIdentityVerifier) private readonly google: GoogleIdentityVerifier
  ) {}

  @Post('register-email')
  @ApiOperation({ summary: 'Create an email account pending verification' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiCreatedResponse({ type: EmailRegistrationResponseDto })
  async registerEmail(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput, @Req() request: Request, @Ip() ipAddress: string): Promise<EmailRegistrationResponseDto> {
    this.limiter.consume('register-email', ipAddress, input.email);
    return this.auth.registerEmail(input, clientContext(request, ipAddress));
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: VerifyEmailRequestDto })
  @ApiOkResponse({ type: AcceptedResponseDto })
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) input: VerifyEmailInput, @Req() request: Request, @Ip() ipAddress: string): Promise<AcceptedResponseDto> {
    this.limiter.consume('verify-email', ipAddress, this.tokens.hashOpaqueToken(input.token));
    await this.auth.verifyEmail(input, clientContext(request, ipAddress));
    return { accepted: true };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBody({ type: ResendVerificationRequestDto })
  @ApiAcceptedResponse({ type: AcceptedResponseDto })
  async resendVerification(@Body(new ZodValidationPipe(resendVerificationSchema)) input: ResendVerificationInput, @Req() request: Request, @Ip() ipAddress: string): Promise<AcceptedResponseDto> {
    this.limiter.consume('resend-verification', ipAddress, input.email);
    await this.auth.resendVerification(input, clientContext(request, ipAddress));
    return { accepted: true };
  }
  @Post('register')
  @ApiOperation({ summary: 'Create an email account pending verification' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiCreatedResponse({ type: EmailRegistrationResponseDto })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Req() request: Request,
    @Ip() ipAddress: string
  ): Promise<EmailRegistrationResponseDto> {
    this.limiter.consume('register-email', ipAddress, input.email);
    return this.auth.registerEmail(input, clientContext(request, ipAddress));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    this.limiter.consume('login', ipAddress, input.email);
    const result = await this.auth.login(input, clientContext(request, ipAddress));
    this.limiter.reset('login', ipAddress, input.email);
    writeAuthCookies(response, result.refreshToken, result.csrfToken, result.refreshExpiresAt);
    return publicResult(result);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with a Google Identity Services ID token' })
  @ApiBody({ type: GoogleLoginRequestDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async googleLogin(
    @Body(new ZodValidationPipe(googleLoginSchema)) input: GoogleLoginInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    const rateLimitIdentity = this.tokens.hashOpaqueToken(input.credential);
    this.limiter.consume('google', ipAddress, rateLimitIdentity);
    const identity = await this.google.verify(input.credential);
    const result = await this.auth.googleLogin(identity, clientContext(request, ipAddress));
    this.limiter.reset('google', ipAddress, rateLimitIdentity);
    writeAuthCookies(response, result.refreshToken, result.csrfToken, result.refreshExpiresAt);
    return publicResult(result);
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Headers('cookie') cookieHeader: string | undefined,
    @Headers('x-csrf-token') csrfHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    const cookies = parseCookies(cookieHeader);
    this.csrf.assertValid(csrfHeader, cookies[CSRF_COOKIE]);
    const refreshToken = cookies[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException('Refresh token is required');
    const result = await this.auth.refresh(refreshToken, clientContext(request, ipAddress));
    writeAuthCookies(response, result.refreshToken, result.csrfToken, result.refreshExpiresAt);
    return publicResult(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Headers('cookie') cookieHeader: string | undefined,
    @Headers('x-csrf-token') csrfHeader: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Ip() ipAddress: string
  ): Promise<void> {
    const cookies = parseCookies(cookieHeader);
    this.csrf.assertValid(csrfHeader, cookies[CSRF_COOKIE]);
    await this.auth.logout(cookies[REFRESH_COOKIE], clientContext(request, ipAddress));
    clearAuthCookies(response);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiAcceptedResponse({ type: AcceptedResponseDto })
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) input: ForgotPasswordInput,
    @Req() request: Request,
    @Ip() ipAddress: string
  ): Promise<AcceptedResponseDto> {
    this.limiter.consume('forgot', ipAddress, input.email);
    await this.auth.forgotPassword(input, clientContext(request, ipAddress));
    return { accepted: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiOkResponse({ type: AcceptedResponseDto })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) input: ResetPasswordInput,
    @Req() request: Request,
    @Ip() ipAddress: string
  ): Promise<AcceptedResponseDto> {
    this.limiter.consume('reset', ipAddress, this.tokens.hashOpaqueToken(input.token));
    await this.auth.resetPassword(input, clientContext(request, ipAddress));
    return { accepted: true };
  }
}
