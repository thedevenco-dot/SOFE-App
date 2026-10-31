import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { adminSessionSchema, adminVerify2faBodySchema, ERROR_CODES } from '@sofe/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { AdminAuth } from '../common/decorators/admin-auth.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { AdminUserDocument } from '../database/schemas/admin-user.schema';
import { AdminAuthService } from './admin-auth.service';

class AdminSessionDto {
  firebaseToken!: string;
}

class AdminVerifyDto {
  tempToken?: string;
  code!: string;
}

@ApiTags('Admin Auth')
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('auth/session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or load admin session from Firebase token' })
  @ApiResponse({ status: 200, description: '2FA challenge or setup required' })
  @UsePipes(new ZodValidationPipe(adminSessionSchema))
  async createSession(
    @Body() body: AdminSessionDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const token =
      body.firebaseToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '');

    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Firebase token is required',
      });
    }

    return this.adminAuthService.createSession(token);
  }

  @Public()
  @Post('auth/2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Setup TOTP 2FA for an admin account' })
  @ApiResponse({ status: 200, description: 'Secret and backup codes generated' })
  async setup2fa(
    @Headers('authorization') authHeader?: string,
    @Body('tempToken') bodyTempToken?: string,
  ) {
    const token = bodyTempToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '');

    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Temporary 2FA token or Bearer token is required',
      });
    }

    const admin = await this.adminAuthService.resolveAdminFromTempToken(token);
    return this.adminAuthService.setup2fa(admin);
  }

  @Public()
  @Post('auth/2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TOTP 2FA code and obtain admin session token' })
  @ApiResponse({ status: 200, description: 'Session token issued' })
  @UsePipes(new ZodValidationPipe(adminVerify2faBodySchema))
  async verify2fa(@Body() body: AdminVerifyDto, @Headers('authorization') authHeader?: string) {
    const token = body.tempToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '');

    if (!token) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Temporary 2FA token is required to verify',
      });
    }

    const admin = await this.adminAuthService.resolveAdminFromTempToken(token);
    return this.adminAuthService.verify2fa(admin, body.code);
  }

  @AdminAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current admin profile and unified permissions' })
  @ApiResponse({ status: 200, description: 'Current admin details' })
  getMe(@CurrentAdmin() admin: AdminUserDocument) {
    const permissions = this.adminAuthService.getPermissionsForAdmin(admin);
    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      roles: admin.roles,
      permissions,
      twoFactorEnabled: admin.twoFactorEnabled,
      lastLoginAt: admin.lastLoginAt,
    };
  }
}
