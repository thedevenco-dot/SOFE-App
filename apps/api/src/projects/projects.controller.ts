import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  type CreateProjectDto,
  type UpdateProjectDto,
  type ProjectQueryDto,
} from '@sofe/shared';
import { Auth } from '../common/decorators/auth.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProjectsService } from './projects.service';
import { User, UserDocument } from '../database/schemas/user.schema';
import { FirebaseService } from '../auth/firebase/firebase.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly firebaseService: FirebaseService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private async extractCurrentUserId(req: Request): Promise<string | undefined> {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = await this.firebaseService.verifyIdToken(token);
        const user = await this.userModel.findOne({ firebaseUid: decoded.uid }).lean();
        if (user) {
          return user._id.toString();
        }
      } catch {
        // Ignore unverified or expired token for optional auth routes
      }
    }
    return undefined;
  }

  @Auth()
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(createProjectSchema)) dto: CreateProjectDto,
  ) {
    const data = await this.projectsService.create(user._id.toString(), dto);
    return { data };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List projects (public feed or filtered by user)' })
  @ApiResponse({ status: 200, description: 'Projects list' })
  async list(
    @Query(new ZodValidationPipe(projectQuerySchema)) query: ProjectQueryDto,
    @Req() req: Request,
  ) {
    const currentUserId = await this.extractCurrentUserId(req);
    const result = await this.projectsService.list(query, currentUserId);
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.hasMore,
      },
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getById(@Param('id') id: string, @Req() req: Request) {
    const currentUserId = await this.extractCurrentUserId(req);
    const data = await this.projectsService.findById(id, currentUserId);
    return { data };
  }

  @Auth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body(new ZodValidationPipe(updateProjectSchema)) dto: UpdateProjectDto,
  ) {
    const data = await this.projectsService.update(id, user._id.toString(), dto);
    return { data };
  }

  @Auth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.projectsService.delete(id, user._id.toString());
  }
}
