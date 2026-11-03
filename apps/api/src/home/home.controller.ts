import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser } from '../common/decorators';
import { UserDocument } from '../database/schemas/user.schema';
import {
  CreateVisionBoardItemDto,
  UpdateVisionBoardItemDto,
  ReorderVisionBoardItemsDto,
  ToggleTaskDto,
} from '@sofe/shared';
import { HomeService, getDateKeyInTimezone } from './home.service';

@ApiTags('Home Dashboard')
@Controller('home')
@Auth()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated Home Dashboard (HM1) payload' })
  @ApiResponse({ status: 200, description: 'Home dashboard data' })
  async getHome(@CurrentUser() user: UserDocument, @Query('tz') tz?: string) {
    const data = await this.homeService.getHomeDashboard(user._id.toString(), tz);
    return { data };
  }

  @Get('plan')
  @ApiOperation({ summary: "Get or generate today's daily plan" })
  @ApiResponse({ status: 200, description: 'Daily plan' })
  async getDailyPlan(
    @CurrentUser() user: UserDocument,
    @Query('tz') tz?: string,
    @Query('dateKey') dateKeyQuery?: string,
  ) {
    const resolvedDateKey = dateKeyQuery || getDateKeyInTimezone(tz).dateKey;
    const plan = await this.homeService.getOrCreateDailyPlan(user._id.toString(), resolvedDateKey);
    return { data: plan };
  }

  @Patch('plan/tasks/:taskId')
  @ApiOperation({ summary: 'Toggle completion of a daily plan task' })
  @ApiResponse({ status: 200, description: 'Updated daily plan' })
  async toggleTask(
    @CurrentUser() user: UserDocument,
    @Param('taskId') taskId: string,
    @Body() body: ToggleTaskDto,
    @Query('dateKey') dateKey?: string,
  ) {
    const plan = await this.homeService.toggleTaskCompletion(
      user._id.toString(),
      taskId,
      body.done,
      dateKey,
    );
    return { data: plan };
  }

  @Get('vision-board')
  @ApiOperation({ summary: 'List vision board items for the learner (HM4)' })
  @ApiResponse({ status: 200, description: 'List of vision board tiles' })
  async getVisionBoard(@CurrentUser() user: UserDocument) {
    const items = await this.homeService.getVisionBoardItems(user._id.toString());
    return { data: items };
  }

  @Post('vision-board')
  @ApiOperation({ summary: 'Add a new vision board item (max 12) (HM5)' })
  @ApiResponse({ status: 201, description: 'Created vision board tile' })
  async createVisionBoardItem(
    @CurrentUser() user: UserDocument,
    @Body() body: CreateVisionBoardItemDto,
  ) {
    const item = await this.homeService.createVisionBoardItem(user._id.toString(), body);
    return { data: item };
  }

  @Patch('vision-board/:id')
  @ApiOperation({ summary: 'Update a vision board item' })
  @ApiResponse({ status: 200, description: 'Updated vision board tile' })
  async updateVisionBoardItem(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() body: UpdateVisionBoardItemDto,
  ) {
    const item = await this.homeService.updateVisionBoardItem(user._id.toString(), id, body);
    return { data: item };
  }

  @Put('vision-board/reorder')
  @ApiOperation({ summary: 'Reorder vision board items' })
  @ApiResponse({ status: 200, description: 'Reordered vision board items' })
  async reorderVisionBoardItems(
    @CurrentUser() user: UserDocument,
    @Body() body: ReorderVisionBoardItemsDto,
  ) {
    const items = await this.homeService.reorderVisionBoardItems(user._id.toString(), body.itemIds);
    return { data: items };
  }

  @Delete('vision-board/:id')
  @ApiOperation({ summary: 'Delete a vision board item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  async deleteVisionBoardItem(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    const result = await this.homeService.deleteVisionBoardItem(user._id.toString(), id);
    return { data: result };
  }

  @Get('quotes')
  @ApiOperation({ summary: 'List available quotes for HM2 selector sheet' })
  @ApiResponse({ status: 200, description: 'Quotes list' })
  async getQuotes() {
    const quotes = await this.homeService.listQuotes();
    return { data: quotes };
  }

  @Get('words')
  @ApiOperation({ summary: 'List available words for HM3 selector sheet' })
  @ApiResponse({ status: 200, description: 'Words list' })
  async getWords() {
    const words = await this.homeService.listWords();
    return { data: words };
  }
}
