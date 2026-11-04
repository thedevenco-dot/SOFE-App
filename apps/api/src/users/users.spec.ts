import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import {
  User,
  UserDocument,
  Enrollment,
  LessonProgress,
  PracticeAttempt,
  Achievement,
  UserAchievement,
  Project,
} from '../database/schemas';

describe('UsersService', () => {
  let service: UsersService;

  const validUserId = new Types.ObjectId().toString();

  const mockUser = {
    _id: validUserId,
    name: 'Original Founder',
    headline: 'Building something great',
    pointsBalance: 150,
    streak: { current: 5, longest: 10 },
  };

  const mockUserModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockEnrollmentModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockLessonProgressModel = {
    find: jest.fn(),
  };

  const mockPracticeAttemptModel = {
    find: jest.fn(),
  };

  const mockAchievementModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockUserAchievementModel = {
    find: jest.fn(),
  };

  const mockProjectModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Enrollment.name), useValue: mockEnrollmentModel },
        { provide: getModelToken(LessonProgress.name), useValue: mockLessonProgressModel },
        { provide: getModelToken(PracticeAttempt.name), useValue: mockPracticeAttemptModel },
        { provide: getModelToken(Achievement.name), useValue: mockAchievementModel },
        { provide: getModelToken(UserAchievement.name), useValue: mockUserAchievementModel },
        { provide: getModelToken(Project.name), useValue: mockProjectModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user document in standard envelope', async () => {
      const result = await service.getMe(mockUser as unknown as UserDocument);
      expect(result.data).toBe(mockUser);
    });
  });

  describe('updateMe', () => {
    it('should update user and return updated document', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };
      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce(updatedUser);

      const result = await service.updateMe(mockUser as unknown as UserDocument, {
        name: 'Updated Name',
      });
      expect(result.data.name).toBe('Updated Name');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        { $set: { name: 'Updated Name' } },
        { new: true, runValidators: true },
      );
    });

    it('should throw NotFoundException if user is not found on update', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce(null);

      await expect(
        service.updateMe(mockUser as unknown as UserDocument, {
          name: 'Updated Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyStats (Task T3.9)', () => {
    it('aggregates curriculum progress, 7-day chart, practice stats, and achievements', async () => {
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      mockEnrollmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { status: 'completed', progress: { percent: 100 } },
          { status: 'active', progress: { percent: 0 } },
        ]),
      });

      mockLessonProgressModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { watchedSec: 3600, updatedAt: new Date() },
          { watchedSec: 1800, updatedAt: new Date() },
        ]),
      });

      mockPracticeAttemptModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { score: 80, passed: true },
          { score: 100, passed: true },
        ]),
      });

      mockAchievementModel.countDocuments.mockResolvedValue(6);

      mockUserAchievementModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue([{ achievementKey: 'streak_7', unlockedAt: new Date() }]),
        }),
      });

      const res = await service.getMyStats(validUserId);

      expect(res.progressRing.completedCourses).toBe(1);
      expect(res.progressRing.totalCourses).toBe(2);
      expect(res.progressRing.percent).toBe(50);
      expect(res.progressRing.hoursWatched).toBe(1.5);
      expect(res.learningTimeChart.length).toBe(7);
      expect(res.practiceStats.currentStreak).toBe(5);
      expect(res.practiceStats.quizzesCompleted).toBe(2);
      expect(res.practiceStats.avgScorePercent).toBe(90);
      expect(res.achievementsSummary.unlockedCount).toBe(1);
      expect(res.achievementsSummary.totalCount).toBe(6);
    });
  });

  describe('getPublicProfile (Task T3.9)', () => {
    it('returns public profile info and published projects', async () => {
      mockUserModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(validUserId),
          name: 'Jane Doe',
          headline: 'Tech Founder',
          bio: 'Passionate builder',
          counters: { followers: 12, following: 8, projects: 2 },
          interests: ['AI', 'Startups'],
          goals: ['Scale'],
        }),
      });

      mockProjectModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              userId: new Types.ObjectId(validUserId),
              title: 'Project A',
              summary: 'Desc A',
              status: 'published',
              visibility: 'public',
            },
          ]),
        }),
      });

      mockUserAchievementModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                achievementId: {
                  key: 'streak_7',
                  title: '7-Day Streak',
                  badgeUrl: 'https://cdn.sofe.com/badge.png',
                  tier: 'gold',
                },
                unlockedAt: new Date(),
              },
            ]),
          }),
        }),
      });

      const res = await service.getPublicProfile(validUserId);
      expect(res.displayName).toBeDefined();
      expect(res.projects?.length).toBe(1);
      expect(res.achievements?.length).toBe(1);
    });
  });
});
