import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService, SessionResponse, LogoutResponse } from './auth.service';
import { UserDocument } from '../database/schemas/user.schema';
import { ApiSuccessEnvelope } from '@sofe/shared';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or load user session after Firebase login' })
  @ApiHeader({
    name: 'authorization',
    description: 'Bearer <Firebase ID token>',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Session initialized successfully' })
  @ApiResponse({ status: 401, description: 'Token verification failed' })
  async session(
    @Headers('authorization') authHeader?: string,
    @Body('token') bodyToken?: string,
  ): Promise<ApiSuccessEnvelope<SessionResponse>> {
    let token = bodyToken;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    return this.authService.createOrLoadSession(token || '');
  }

  @Auth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and optionally invalidate push token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentUser() user: UserDocument,
    @Body('pushToken') pushToken?: string,
  ): Promise<ApiSuccessEnvelope<LogoutResponse>> {
    return this.authService.logout(user, pushToken);
  }
}
