import { practiseApi } from './practise-api';
import { api } from './api-client';

jest.mock('./api-client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('practiseApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls GET /practise/today with timezone parameter', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ dateKey: '2026-11-04' });
    const res = await practiseApi.getTodayPractice('Asia/Kolkata');
    expect(api.get).toHaveBeenCalledWith('/practise/today', {
      params: { tz: 'Asia/Kolkata' },
    });
    expect(res).toEqual({ dateKey: '2026-11-04' });
  });

  it('calls GET /practise/history with limit', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce([]);
    await practiseApi.getPracticeHistory(15);
    expect(api.get).toHaveBeenCalledWith('/practise/history', {
      params: { limit: 15 },
    });
  });

  it('calls GET /quizzes/:id', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ id: 'quiz-1' });
    const res = await practiseApi.getPublicQuiz('quiz-1');
    expect(api.get).toHaveBeenCalledWith('/quizzes/quiz-1');
    expect(res).toEqual({ id: 'quiz-1' });
  });

  it('calls POST /quizzes/:id/submit with answers and timezone', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ score: 90, passed: true });
    const answers = [{ questionId: 'q1', selectedOptionIds: ['opt1'] }];
    const res = await practiseApi.submitQuiz('quiz-1', answers, 'UTC');
    expect(api.post).toHaveBeenCalledWith(
      '/quizzes/quiz-1/submit',
      { answers },
      { params: { tz: 'UTC' } },
    );
    expect(res).toEqual({ score: 90, passed: true });
  });

  it('calls GET /practise/reflection/today and POST /practise/reflection', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ id: 'p1', prompt: 'Strategic reflection' });
    (api.post as jest.Mock).mockResolvedValueOnce({ success: true, pointsAwarded: 20 });

    const prompt = await practiseApi.getTodayReflection('UTC');
    expect(api.get).toHaveBeenCalledWith('/practise/reflection/today', {
      params: { tz: 'UTC' },
    });
    expect(prompt.id).toBe('p1');

    const result = await practiseApi.submitReflection(
      { responseText: 'Great insights on CAC to LTV' },
      'UTC',
    );
    expect(api.post).toHaveBeenCalledWith(
      '/practise/reflection',
      { responseText: 'Great insights on CAC to LTV' },
      { params: { tz: 'UTC' } },
    );
    expect(result.pointsAwarded).toBe(20);
  });

  it('calls GET /streak/status and GET /points/balance', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ current: 4 });
    (api.get as jest.Mock).mockResolvedValueOnce({ balance: 450 });

    const streak = await practiseApi.getStreakStatus('UTC');
    expect(api.get).toHaveBeenCalledWith('/streak/status', {
      params: { tz: 'UTC' },
    });
    expect(streak.current).toBe(4);

    const balance = await practiseApi.getPointsBalance();
    expect(api.get).toHaveBeenCalledWith('/points/balance');
    expect(balance.balance).toBe(450);
  });

  it('calls GET /points/history with pagination and filter', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ entries: [], total: 0 });
    await practiseApi.getPointsHistory({ page: 2, limit: 10, reason: 'quiz' });
    expect(api.get).toHaveBeenCalledWith('/points/history', {
      params: { page: 2, limit: 10, reason: 'quiz' },
    });
  });

  it('calls GET /practise/rewards and POST /practise/rewards/:id/redeem', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce([{ id: 'r1', title: 'Course' }]);
    (api.post as jest.Mock).mockResolvedValueOnce({ success: true, remainingBalance: 200 });

    const rewards = await practiseApi.getRewards();
    expect(api.get).toHaveBeenCalledWith('/practise/rewards');
    expect(rewards.length).toBe(1);

    const redeem = await practiseApi.redeemReward('r1');
    expect(api.post).toHaveBeenCalledWith('/practise/rewards/r1/redeem');
    expect(redeem.remainingBalance).toBe(200);
  });
});
