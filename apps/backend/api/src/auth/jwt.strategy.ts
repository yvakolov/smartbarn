import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from './auth.types';

interface SessionPayload extends AuthenticatedUser {
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => request.cookies?.['sb_session'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env['AUTH_COOKIE_SECRET'] ?? 'smartbarn-dev-secret',
    });
  }

  validate(payload: SessionPayload): AuthenticatedUser {
    const { iat: _iat, exp: _exp, ...user } = payload;
    return user;
  }
}
