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

describe('Profile & Projects Flow Integration (Task T3.9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PF1 Progress & PF5 Stats Flow', () => {
    it('retrieves learning stats and validates progress ring and 7-day chart', async () => {
      const mockStats = {
        progressRing: {
          percent: 75,
          completedCourses: 3,
          totalCourses: 4,
          hoursWatched: 12.5,
        },
        learningTimeChart: [
          { dateKey: '2026-10-29', minutes: 45, dayLabel: 'Wed' },
          { dateKey: '2026-10-30', minutes: 60, dayLabel: 'Thu' },
          { dateKey: '2026-10-31', minutes: 30, dayLabel: 'Fri' },
          { dateKey: '2026-11-01', minutes: 90, dayLabel: 'Sat' },
          { dateKey: '2026-11-02', minutes: 0, dayLabel: 'Sun' },
          { dateKey: '2026-11-03', minutes: 45, dayLabel: 'Mon' },
          { dateKey: '2026-11-04', minutes: 20, dayLabel: 'Tue' },
        ],
        practiceStats: {
          currentStreak: 7,
          longestStreak: 14,
          quizzesCompleted: 12,
          avgScorePercent: 92,
          totalPoints: 450,
        },
        achievementsSummary: {
          totalCount: 6,
          unlockedCount: 3,
          latestUnlocked: ['streak_7', 'quiz_master'],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockStats);

      const stats = await profileApi.getMyStats();

      expect(api.get).toHaveBeenCalledWith('/me/stats');
      expect(stats.progressRing.percent).toBe(75);
      expect(stats.progressRing.completedCourses).toBe(3);
      expect(stats.learningTimeChart.length).toBe(7);
      expect(stats.practiceStats.currentStreak).toBe(7);
      expect(stats.achievementsSummary.unlockedCount).toBe(3);
    });
  });

  describe('PF4 Edit Profile Flow', () => {
    it('updates profile fields and reflects new bio and location', async () => {
      const updatedProfile = {
        id: 'u_123',
        name: 'Sarah Connor',
        headline: 'Founder & Builder',
        bio: 'Building AI defense network',
        location: 'Los Angeles, USA',
        interests: ['Robotics', 'AI'],
        goals: ['Scale Seed'],
      };

      (api.patch as jest.Mock).mockResolvedValue(updatedProfile);

      const res = await profileApi.updateMyProfile({
        name: 'Sarah Connor',
        headline: 'Founder & Builder',
        bio: 'Building AI defense network',
        location: 'Los Angeles, USA',
        interests: ['Robotics', 'AI'],
        goals: ['Scale Seed'],
      });

      expect(api.patch).toHaveBeenCalledWith('/me', {
        name: 'Sarah Connor',
        headline: 'Founder & Builder',
        bio: 'Building AI defense network',
        location: 'Los Angeles, USA',
        interests: ['Robotics', 'AI'],
        goals: ['Scale Seed'],
      });
      expect(res.name).toBe('Sarah Connor');
      expect(res.location).toBe('Los Angeles, USA');
    });
  });

  describe('PF2, PF7-PF9 Projects Full Lifecycle Flow', () => {
    it('creates, lists, gets, updates, and deletes a portfolio project', async () => {
      // 1. Create project
      const createdProject = {
        id: 'proj_999',
        title: 'Autonomous Agent Platform',
        summary: 'Decentralized autonomous AI agent orchestration.',
        status: 'draft',
        visibility: 'public',
        tags: ['agents', 'ai'],
        links: ['https://github.com/org/agents'],
        files: [{ name: 'pitch.pdf', url: 'https://cdn.sofe.com/pitch.pdf', size: 1048576 }],
      };

      (api.post as jest.Mock).mockResolvedValue(createdProject);

      const newProj = await profileApi.createProject({
        title: 'Autonomous Agent Platform',
        summary: 'Decentralized autonomous AI agent orchestration.',
        status: 'draft',
        visibility: 'public',
        tags: ['agents', 'ai'],
        links: ['https://github.com/org/agents'],
        files: [{ name: 'pitch.pdf', url: 'https://cdn.sofe.com/pitch.pdf', size: 1048576 }],
      });

      expect(api.post).toHaveBeenCalledWith('/projects', expect.any(Object));
      expect(newProj.id).toBe('proj_999');
      expect(newProj.status).toBe('draft');

      // 2. List projects filtered by status
      (api.get as jest.Mock).mockResolvedValue([createdProject]);
      const list = await profileApi.listProjects({ status: 'draft' });
      expect(api.get).toHaveBeenCalledWith('/projects', { params: { status: 'draft' } });
      expect(list.length).toBe(1);

      // 3. Get project detail
      (api.get as jest.Mock).mockResolvedValue(createdProject);
      const detail = await profileApi.getProject('proj_999');
      expect(api.get).toHaveBeenCalledWith('/projects/proj_999');
      expect(detail.title).toBe('Autonomous Agent Platform');
      expect(detail.files.length).toBe(1);

      // 4. Update project to published
      const updatedProject = { ...createdProject, status: 'published' };
      (api.patch as jest.Mock).mockResolvedValue(updatedProject);
      const updated = await profileApi.updateProject('proj_999', { status: 'published' });
      expect(api.patch).toHaveBeenCalledWith('/projects/proj_999', { status: 'published' });
      expect(updated.status).toBe('published');

      // 5. Delete project
      (api.del as jest.Mock).mockResolvedValue({ success: true });
      const delRes = await profileApi.deleteProject('proj_999');
      expect(api.del).toHaveBeenCalledWith('/projects/proj_999');
      expect(delRes.success).toBe(true);
    });
  });

  describe('PF3 & PF6 Achievements Showcase Flow', () => {
    it('retrieves achievements list and verifies progress calculation', async () => {
      const mockAchievements = {
        totalCount: 6,
        unlockedCount: 2,
        items: [
          {
            id: 'ach_1',
            key: 'streak_7',
            title: '7-Day Streak',
            description: 'Maintain a 7-day streak',
            tier: 'gold',
            pointsReward: 50,
            unlocked: true,
            unlockedAt: '2026-11-01T10:00:00Z',
            progress: { current: 7, threshold: 7, percent: 100 },
          },
          {
            id: 'ach_2',
            key: 'quiz_master',
            title: 'Quiz Master',
            description: 'Pass 5 quizzes with 100% score',
            tier: 'gold',
            pointsReward: 75,
            unlocked: false,
            progress: { current: 3, threshold: 5, percent: 60 },
          },
        ],
      };

      (api.get as jest.Mock).mockResolvedValue(mockAchievements);

      const res = await profileApi.getAchievements();

      expect(api.get).toHaveBeenCalledWith('/achievements');
      expect(res.totalCount).toBe(6);
      expect(res.unlockedCount).toBe(2);
      expect(res.items[0].unlocked).toBe(true);
      expect(res.items[1].unlocked).toBe(false);
      expect(res.items[1].progress.percent).toBe(60);
    });
  });
});
