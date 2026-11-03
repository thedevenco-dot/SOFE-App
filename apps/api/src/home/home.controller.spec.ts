import { Types } from 'mongoose';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { UserDocument } from '../database/schemas/user.schema';

describe('HomeController (Task T3.1)', () => {
  let controller: HomeController;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockUser = {
    _id: new Types.ObjectId(mockUserId),
    fullName: 'Aravind Sridhar',
    email: 'aravind@example.com',
  } as unknown as UserDocument;

  const mockHomeService = {
    getHomeDashboard: jest.fn(),
    getOrCreateDailyPlan: jest.fn(),
    toggleTaskCompletion: jest.fn(),
    getVisionBoardItems: jest.fn(),
    createVisionBoardItem: jest.fn(),
    updateVisionBoardItem: jest.fn(),
    reorderVisionBoardItems: jest.fn(),
    deleteVisionBoardItem: jest.fn(),
    listQuotes: jest.fn(),
    listWords: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new HomeController(mockHomeService as unknown as HomeService);
  });

  it('GET /home returns aggregated dashboard', async () => {
    mockHomeService.getHomeDashboard.mockResolvedValueOnce({
      greeting: 'Good morning, Aravind.',
      todayPlan: { items: [] },
    });

    const res = await controller.getHome(mockUser, 'Asia/Kolkata');
    expect(mockHomeService.getHomeDashboard).toHaveBeenCalledWith(mockUserId, 'Asia/Kolkata');
    expect(res.data.greeting).toContain('Aravind');
  });

  it('GET /home/plan returns or creates daily plan', async () => {
    mockHomeService.getOrCreateDailyPlan.mockResolvedValueOnce({
      id: 'plan-1',
      dateKey: '2026-11-03',
      items: [],
    });

    const res = await controller.getDailyPlan(mockUser, 'Asia/Kolkata', '2026-11-03');
    expect(mockHomeService.getOrCreateDailyPlan).toHaveBeenCalledWith(mockUserId, '2026-11-03');
    expect(res.data.id).toBe('plan-1');
  });

  it('PATCH /home/plan/tasks/:taskId toggles task completion', async () => {
    mockHomeService.toggleTaskCompletion.mockResolvedValueOnce({
      id: 'plan-1',
      completedCount: 1,
    });

    const res = await controller.toggleTask(mockUser, 'task-1', { done: true }, '2026-11-03');
    expect(mockHomeService.toggleTaskCompletion).toHaveBeenCalledWith(
      mockUserId,
      'task-1',
      true,
      '2026-11-03',
    );
    expect(res.data.completedCount).toBe(1);
  });

  it('GET /home/vision-board returns vision items', async () => {
    mockHomeService.getVisionBoardItems.mockResolvedValueOnce([{ id: 'v-1', caption: 'Goal 1' }]);

    const res = await controller.getVisionBoard(mockUser);
    expect(mockHomeService.getVisionBoardItems).toHaveBeenCalledWith(mockUserId);
    expect(res.data.length).toBe(1);
  });

  it('POST /home/vision-board creates vision item', async () => {
    const dto = { imageUrl: 'https://example.com/goal.jpg', caption: 'Milestone 1' };
    mockHomeService.createVisionBoardItem.mockResolvedValueOnce({
      id: 'v-1',
      ...dto,
    });

    const res = await controller.createVisionBoardItem(mockUser, dto);
    expect(mockHomeService.createVisionBoardItem).toHaveBeenCalledWith(mockUserId, dto);
    expect(res.data.id).toBe('v-1');
  });

  it('PATCH /home/vision-board/:id updates vision item', async () => {
    const dto = { caption: 'Updated Title' };
    mockHomeService.updateVisionBoardItem.mockResolvedValueOnce({
      id: 'v-1',
      caption: 'Updated Title',
    });

    const res = await controller.updateVisionBoardItem(mockUser, 'v-1', dto);
    expect(mockHomeService.updateVisionBoardItem).toHaveBeenCalledWith(mockUserId, 'v-1', dto);
    expect(res.data.caption).toBe('Updated Title');
  });

  it('PUT /home/vision-board/reorder reorders items', async () => {
    mockHomeService.reorderVisionBoardItems.mockResolvedValueOnce([
      { id: 'v-2', order: 0 },
      { id: 'v-1', order: 1 },
    ]);

    const res = await controller.reorderVisionBoardItems(mockUser, { itemIds: ['v-2', 'v-1'] });
    expect(mockHomeService.reorderVisionBoardItems).toHaveBeenCalledWith(mockUserId, [
      'v-2',
      'v-1',
    ]);
    expect(res.data[0].id).toBe('v-2');
  });

  it('DELETE /home/vision-board/:id deletes vision item', async () => {
    mockHomeService.deleteVisionBoardItem.mockResolvedValueOnce({ success: true });

    const res = await controller.deleteVisionBoardItem(mockUser, 'v-1');
    expect(mockHomeService.deleteVisionBoardItem).toHaveBeenCalledWith(mockUserId, 'v-1');
    expect(res.data.success).toBe(true);
  });

  it('GET /home/quotes and GET /home/words return lists', async () => {
    mockHomeService.listQuotes.mockResolvedValueOnce([{ id: 'q-1', text: 'Quote 1' }]);
    mockHomeService.listWords.mockResolvedValueOnce([{ id: 'w-1', word: 'WORD' }]);

    const quotesRes = await controller.getQuotes();
    expect(quotesRes.data.length).toBe(1);

    const wordsRes = await controller.getWords();
    expect(wordsRes.data.length).toBe(1);
  });
});
