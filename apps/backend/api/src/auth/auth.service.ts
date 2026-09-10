import { Injectable } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthService {
  createSessionToken(user: AuthenticatedUser): string {
    return sign(user, process.env['AUTH_COOKIE_SECRET'] ?? 'smartbarn-dev-secret', {
      expiresIn: '7d',
      issuer: 'smartbarn-api',
      audience: 'smartbarn-client',
    });
  }
}
