import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ): void {
    const token = this.authService.createSessionToken(request.user);
    const isProduction = process.env['NODE_ENV'] === 'production';

    response.cookie('sb_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    response.redirect(process.env['CLIENT_URL'] ?? 'http://localhost:4200/app/floor-field');
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() request: AuthenticatedRequest): AuthenticatedUser {
    return request.user;
  }

  @Post('logout')
  logout(@Res() response: Response): void {
    response.clearCookie('sb_session', { path: '/' });
    response.status(204).send();
  }
}
