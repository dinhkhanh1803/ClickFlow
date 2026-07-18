import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from '../authorization/authenticated-user';
import { PrismaService } from '../database/prisma.service';
import { PUBLIC_ROUTE_METADATA } from './public.decorator';
import { TokenService } from './token.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers?.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer access token is required');
    const payload = this.tokens.verifyAccessToken(header.slice(7));
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, archivedAt: null },
      select: { id: true, email: true }
    });
    if (!user) throw new UnauthorizedException('Account is unavailable');
    request.user = user;
    return true;
  }
}
