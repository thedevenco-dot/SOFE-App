import { profileApi } from './profile-api';
import { api } from './api-client';

jest.mock('./api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    del: jest.fn(),
  },
}));

describe('profileApi (Task T3.9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getMyProfile', async () => {
    (api.get as jest.Mock).mockResolvedValue({ id: 'u1', name: 'Learner' });
    const res = await profileApi.getMyProfile();
    expect(api.get).toHaveBeenCalledWith('/me');
    expect(res.name).toBe('Learner');
  });

  it('calls updateMyProfile', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ id: 'u1', name: 'Updated' });
    const res = await profileApi.updateMyProfile({ name: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/me', { name: 'Updated' });
    expect(res.name).toBe('Updated');
  });

  it('calls getMyStats', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      progressRing: { percent: 45, completedCourses: 1, totalCourses: 2, hoursWatched: 2.5 },
      learningTimeChart: [],
      practiceStats: { currentStreak: 3 },
      achievementsSummary: { unlockedCount: 2, totalCount: 6, latestUnlocked: [] },
    });
    const res = await profileApi.getMyStats();
    expect(api.get).toHaveBeenCalledWith('/me/stats');
    expect(res.progressRing.percent).toBe(45);
  });

  it('calls getPublicProfile', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      id: 'target_u',
      displayName: 'Alice',
    });
    const res = await profileApi.getPublicProfile('target_u');
    expect(api.get).toHaveBeenCalledWith('/users/target_u');
    expect(res.displayName).toBe('Alice');
  });

  it('calls listProjects', async () => {
    (api.get as jest.Mock).mockResolvedValue([{ id: 'p1', title: 'Project 1' }]);
    const res = await profileApi.listProjects({ status: 'published' });
    expect(api.get).toHaveBeenCalledWith('/projects', { params: { status: 'published' } });
    expect(res.length).toBe(1);
  });

  it('calls getProject', async () => {
    (api.get as jest.Mock).mockResolvedValue({ id: 'p1', title: 'Project 1' });
    const res = await profileApi.getProject('p1');
    expect(api.get).toHaveBeenCalledWith('/projects/p1');
    expect(res.id).toBe('p1');
  });

  it('calls createProject', async () => {
    (api.post as jest.Mock).mockResolvedValue({ id: 'p1', title: 'Project 1' });
    const res = await profileApi.createProject({
      title: 'Project 1',
      summary: 'Desc',
      status: 'draft',
      visibility: 'public',
      files: [],
      links: [],
      tags: [],
    });
    expect(api.post).toHaveBeenCalledWith('/projects', expect.any(Object));
    expect(res.id).toBe('p1');
  });

  it('calls updateProject', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ id: 'p1', title: 'Updated' });
    const res = await profileApi.updateProject('p1', { title: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/projects/p1', { title: 'Updated' });
    expect(res.title).toBe('Updated');
  });

  it('calls deleteProject', async () => {
    (api.del as jest.Mock).mockResolvedValue({ success: true });
    const res = await profileApi.deleteProject('p1');
    expect(api.del).toHaveBeenCalledWith('/projects/p1');
    expect(res.success).toBe(true);
  });

  it('calls getAchievements', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      totalCount: 6,
      unlockedCount: 2,
      items: [],
    });
    const res = await profileApi.getAchievements();
    expect(api.get).toHaveBeenCalledWith('/achievements');
    expect(res.totalCount).toBe(6);
  });
});
