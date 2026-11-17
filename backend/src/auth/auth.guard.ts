import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';
import { IS_PUBLIC_ROUTE } from './public.decorator';

const SESSION_COOKIE_NAME = 'notes_session';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getSessionToken(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;

  const matchingCookies = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (matchingCookies.length !== 1) return null;

  const token = matchingCookies[0].slice(SESSION_COOKIE_NAME.length + 1);
  return token.length > 0 ? token : null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & AuthenticatedRequest>();
    const origin = request.headers.origin;

    if (!SAFE_METHODS.has(request.method)) {
      const expectedOrigin =
        this.configService.getOrThrow<string>('FRONTEND_ORIGIN');

      if (origin !== expectedOrigin) {
        throw new ForbiddenException('Origen de solicitud no permitido.');
      }
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;

    const token = getSessionToken(request.headers.cookie);
    if (!token) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }

    request.authUser = this.authService.verifyToken(token);
    return true;
  }
}
