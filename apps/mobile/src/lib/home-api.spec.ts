import { homeApi } from './home-api';
import { api } from './api-client';

jest.mock('./api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    del: jest.fn(),
  },
}));

describe('homeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls GET /home with timezone parameter', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ greeting: 'Good morning' });
    const res = await homeApi.getHomeDashboard('Asia/Kolkata');
    expect(api.get).toHaveBeenCalledWith('/home', {
      params: { tz: 'Asia/Kolkata' },
    });
    expect(res).toEqual({ greeting: 'Good morning' });
  });

  it('calls GET /home/plan', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ items: [] });
    await homeApi.getDailyPlan();
    expect(api.get).toHaveBeenCalledWith('/home/plan', { params: undefined });
  });

  it('calls POST /home/plan/tasks/:taskId to toggle task', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ success: true });
    await homeApi.toggleDailyTask('task-1', true, 'Asia/Kolkata');
    expect(api.post).toHaveBeenCalledWith(
      '/home/plan/tasks/task-1',
      { done: true },
      { params: { tz: 'Asia/Kolkata' } },
    );
  });

  it('manages vision board CRUD and reorder', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce([]);
    (api.post as jest.Mock).mockResolvedValueOnce({ id: 'v1' });
    (api.patch as jest.Mock).mockResolvedValueOnce({ id: 'v1', caption: 'Updated' });
    (api.del as jest.Mock).mockResolvedValueOnce({ success: true });
    (api.put as jest.Mock).mockResolvedValueOnce({ success: true });

    await homeApi.getVisionBoard();
    expect(api.get).toHaveBeenCalledWith('/home/vision-board');

    await homeApi.createVisionBoardItem({
      imageUrl: 'https://example.com/img.jpg',
      caption: 'Unicorn',
    });
    expect(api.post).toHaveBeenCalledWith('/home/vision-board', {
      imageUrl: 'https://example.com/img.jpg',
      caption: 'Unicorn',
    });

    await homeApi.updateVisionBoardItem('v1', { caption: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/home/vision-board/v1', {
      caption: 'Updated',
    });

    await homeApi.deleteVisionBoardItem('v1');
    expect(api.del).toHaveBeenCalledWith('/home/vision-board/v1');

    await homeApi.reorderVisionBoardItems(['v2', 'v1']);
    expect(api.put).toHaveBeenCalledWith('/home/vision-board/reorder', {
      itemIds: ['v2', 'v1'],
    });
  });
});
