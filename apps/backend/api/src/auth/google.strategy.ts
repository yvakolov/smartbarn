import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env['GOOGLE_CLIENT_ID'] ?? 'not-configured',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? 'not-configured',
      callbackURL:
        process.env['GOOGLE_CALLBACK_URL'] ??
        'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): AuthenticatedUser {
    const primaryEmail = profile.emails?.[0]?.value;

    if (!primaryEmail) {
      throw new Error('Google profile does not contain an email address');
    }

    return {
      provider: 'google',
      providerUserId: profile.id,
      email: primaryEmail,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
