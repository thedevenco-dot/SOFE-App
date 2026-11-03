import { Types } from 'mongoose';
import { EnrollmentsController } from './enrollments.controller';
import { LearningCoursesController } from './learning-courses.controller';
import { LessonsController } from './lessons.controller';
import { LearningService } from './learning.service';
import { UserDocument } from '../database/schemas/user.schema';

describe('Learning Controllers (Task T2.12)', () => {
  let enrollmentsController: EnrollmentsController;
  let coursesController: LearningCoursesController;
  let lessonsController: LessonsController;

  const mockUser = {
    _id: new Types.ObjectId(),
    name: 'Aarav Founder',
    email: 'aarav@startup.io',
  } as unknown as UserDocument;

  const mockLearningService = {
    listEnrollments: jest.fn(),
    getContinueLesson: jest.fn(),
    enrollFreeCourse: jest.fn(),
    getCourseCurriculum: jest.fn(),
    getCourseResources: jest.fn(),
    getLesson: jest.fn(),
    getPlaybackToken: jest.fn(),
    updateProgress: jest.fn(),
    submitLessonQuiz: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    enrollmentsController = new EnrollmentsController(
      mockLearningService as unknown as LearningService,
    );
    coursesController = new LearningCoursesController(
      mockLearningService as unknown as LearningService,
    );
    lessonsController = new LessonsController(mockLearningService as unknown as LearningService);
  });

  describe('EnrollmentsController', () => {
    it('GET /enrollments returns list of enrollments for current user', async () => {
      const mockList = [{ id: 'e-1', courseId: 'c-1' }];
      mockLearningService.listEnrollments.mockResolvedValue(mockList);

      const res = await enrollmentsController.getMyEnrollments(mockUser);
      expect(res).toEqual({ data: mockList });
      expect(mockLearningService.listEnrollments).toHaveBeenCalledWith(mockUser._id.toString());
    });
  });

  describe('LearningCoursesController', () => {
    it('GET /courses/continue returns next lesson', async () => {
      mockLearningService.getContinueLesson.mockResolvedValue({ lesson: { id: 'l-1' } });

      const res = await coursesController.continueLearning(mockUser, 'c-1');
      expect(res.data).toBeDefined();
      expect(mockLearningService.getContinueLesson).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'c-1',
      );
    });

    it('POST /courses/:id/enroll enrolls in free course', async () => {
      mockLearningService.enrollFreeCourse.mockResolvedValue({ id: 'e-1', source: 'free' });

      const res = await coursesController.enrollFreeCourse(mockUser, 'free-course');
      expect(res).toEqual({ data: { id: 'e-1', source: 'free' } });
      expect(mockLearningService.enrollFreeCourse).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'free-course',
      );
    });

    it('GET /courses/:id/curriculum returns course curriculum outline', async () => {
      mockLearningService.getCourseCurriculum.mockResolvedValue({ modules: [] });

      const res = await coursesController.getCourseCurriculum(mockUser, 'c-1');
      expect(res).toEqual({ data: { modules: [] } });
      expect(mockLearningService.getCourseCurriculum).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'c-1',
      );
    });

    it('GET /courses/:id/resources returns course resources', async () => {
      mockLearningService.getCourseResources.mockResolvedValue({ resources: [] });

      const res = await coursesController.getCourseResources(mockUser, 'c-1');
      expect(res).toEqual({ data: { resources: [] } });
      expect(mockLearningService.getCourseResources).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'c-1',
      );
    });
  });

  describe('LessonsController', () => {
    it('GET /lessons/:id returns lesson content and progress', async () => {
      mockLearningService.getLesson.mockResolvedValue({ lesson: { id: 'l-1' }, progress: null });

      const res = await lessonsController.getLesson(mockUser, 'l-1');
      expect(res).toEqual({ data: { lesson: { id: 'l-1' }, progress: null } });
      expect(mockLearningService.getLesson).toHaveBeenCalledWith(mockUser._id.toString(), 'l-1');
    });

    it('POST /lessons/:id/playback-token generates signed token', async () => {
      mockLearningService.getPlaybackToken.mockResolvedValue({
        playbackToken: 'jwt-123',
        playbackId: 'p-123',
      });

      const res = await lessonsController.getPlaybackToken(mockUser, 'l-1');
      expect(res).toEqual({ data: { playbackToken: 'jwt-123', playbackId: 'p-123' } });
      expect(mockLearningService.getPlaybackToken).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'l-1',
      );
    });

    it('POST /lessons/:id/progress updates watched seconds and percent', async () => {
      mockLearningService.updateProgress.mockResolvedValue({
        progress: { status: 'in_progress', watchedSec: 120 },
      });

      const body = { watchedSec: 120, percent: 10, completed: false };
      const res = await lessonsController.updateProgress(mockUser, 'l-1', body);
      expect(res).toEqual({ data: { progress: { status: 'in_progress', watchedSec: 120 } } });
      expect(mockLearningService.updateProgress).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'l-1',
        body,
      );
    });

    it('POST /lessons/:id/quiz/submit records quiz submission', async () => {
      mockLearningService.submitLessonQuiz.mockResolvedValue({
        progress: { status: 'completed' },
      });

      const res = await lessonsController.submitQuiz(mockUser, 'l-1', { score: 90 });
      expect(res).toEqual({ data: { progress: { status: 'completed' } } });
      expect(mockLearningService.submitLessonQuiz).toHaveBeenCalledWith(
        mockUser._id.toString(),
        'l-1',
        90,
      );
    });
  });
});
