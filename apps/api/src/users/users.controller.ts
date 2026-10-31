import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { patchMeSchema, type PatchMeInput, type ApiSuccessEnvelope } from '@sofe/shared';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';
import { UserDocument } from '../database/schemas/user.schema';

@ApiTags('Me')
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth()
  @Get()
  @ApiOperation({ summary: 'Get current authenticated learner profile' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  async getMe(@CurrentUser() user: UserDocument): Promise<ApiSuccessEnvelope<UserDocument>> {
    return this.usersService.getMe(user);
  }

  @Auth()
  @Patch()
  @ApiOperation({ summary: 'Update learner profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Account suspended' })
  async updateMe(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(patchMeSchema)) body: PatchMeInput,
  ): Promise<ApiSuccessEnvelope<UserDocument>> {
    return this.usersService.updateMe(user, body);
  }
}
