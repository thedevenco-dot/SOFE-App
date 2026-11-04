import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { UsersService } from './users.service';

interface MaybeAuthenticatedRequest {
  user?: {
    _id?: { toString(): string };
    userId?: string;
  };
}

@ApiTags('Users')
@Controller('users')
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get public founder profile by ID' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('id') targetUserId: string, @Req() req: MaybeAuthenticatedRequest) {
    const currentUserId = req.user?._id?.toString() || req.user?.userId;
    return this.usersService.getPublicProfile(targetUserId, currentUserId);
  }
}
