import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  POINTS_LEDGER_REASONS,
  QUIZ_KINDS,
  QUESTION_TYPES,
  QUIZ_STATUSES,
  type PublicQuizDto,
  type SubmitQuizAttemptDto,
  type QuizAttemptResultDto,
  type QuestionScoringResult,
} from '@sofe/shared';
import {
  Quiz,
  QuizDocument,
  PracticeAttempt,
  PracticeAttemptDocument,
  PracticeSchedule,
  PracticeScheduleDocument,
  DailyPlan,
  DailyPlanDocument,
} from '../database/schemas';
import { getDateKeyInTimezone } from '../home/home.service';
import { PointsService } from '../points/points.service';
import { StreakService } from '../points/streak.service';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(PracticeAttempt.name)
    private readonly practiceAttemptModel: Model<PracticeAttemptDocument>,
    @InjectModel(PracticeSchedule.name)
    private readonly practiceScheduleModel: Model<PracticeScheduleDocument>,
    @InjectModel(DailyPlan.name)
    private readonly dailyPlanModel: Model<DailyPlanDocument>,
    @Optional()
    private readonly pointsService?: PointsService,
    @Optional()
    private readonly streakService?: StreakService,
  ) {}

  /**
   * Retrieves a public, sanitized view of a quiz.
   * Strips correct answers (isCorrect) and explanations to prevent cheating.
   */
  async getPublicQuiz(id: string): Promise<PublicQuizDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    const quiz = await this.quizModel.findOne({
      _id: new Types.ObjectId(id),
      status: QUIZ_STATUSES.PUBLISHED,
    });

    if (!quiz) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    return {
      id: quiz._id.toString(),
      title: quiz.title,
      kind: quiz.kind,
      passingScorePercent: quiz.passingScorePercent,
      questionCount: quiz.questions.length,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
        })),
      })),
    };
  }

  /**
   * Evaluates user quiz submissions server-side.
   * Compares submitted answers against correct DB answers.
   * Computes score, passed status, awards points idempotently, and records streak activity.
   */
  async submitQuiz(
    userId: string,
    quizId: string,
    dto: SubmitQuizAttemptDto,
    tz?: string,
  ): Promise<QuizAttemptResultDto> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    const submittedAnswers = dto.answers || [];
    const questionsResult: QuestionScoringResult[] = [];

    for (const q of quiz.questions) {
      const submitted = submittedAnswers.find((a) => a.questionId === q.id);
      const selectedOptionIds = submitted ? submitted.selectedOptionIds : [];
      const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);

      let isCorrect = false;
      if (q.type === QUESTION_TYPES.SINGLE || q.type === QUESTION_TYPES.TRUE_FALSE) {
        isCorrect =
          selectedOptionIds.length === 1 && correctOptionIds.includes(selectedOptionIds[0]);
      } else if (q.type === QUESTION_TYPES.MULTI) {
        isCorrect =
          correctOptionIds.length > 0 &&
          selectedOptionIds.length === correctOptionIds.length &&
          correctOptionIds.every((cid) => selectedOptionIds.includes(cid));
      }

      // Pick explanation from correct option or question option
      const explanation =
        q.options.find((o) => o.isCorrect && o.explanation)?.explanation ||
        q.options.find((o) => o.explanation)?.explanation ||
        undefined;

      questionsResult.push({
        questionId: q.id,
        questionText: q.text,
        type: q.type,
        selectedOptionIds,
        correctOptionIds,
        isCorrect,
        explanation,
      });
    }

    const totalQuestions = quiz.questions.length;
    const correctQuestions = questionsResult.filter((r) => r.isCorrect).length;
    const score = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
    const passed = score >= (quiz.passingScorePercent ?? 80);
    const pointsAwarded = passed ? 50 : 0;

    const uId = new Types.ObjectId(userId);
    const attempt = await this.practiceAttemptModel.create({
      userId: uId,
      quizId: quiz._id,
      answers: submittedAnswers.map((a) => ({
        questionId: a.questionId,
        selectedOptionIds: a.selectedOptionIds,
      })),
      score,
      passed,
      pointsAwarded,
      completedAt: new Date(),
    });

    const attemptId = attempt._id.toString();
    const { dateKey } = getDateKeyInTimezone(tz);

    // If passed, award points idempotently and record streak activity
    if (passed) {
      if (this.pointsService) {
        await this.pointsService
          .awardPoints({
            userId,
            amount: pointsAwarded,
            reason: POINTS_LEDGER_REASONS.QUIZ,
            idempotencyKey: `quiz_attempt:${attemptId}`,
            note: `Completed quiz: ${quiz.title}`,
          })
          .catch(() => null);
      }

      if (this.streakService) {
        await this.streakService
          .recordActivity(userId, tz || 'UTC', undefined, 1, pointsAwarded)
          .catch(() => null);
      }
    }

    // Update PracticeSchedule slot if quick_quiz
    if (quiz.kind === QUIZ_KINDS.QUICK_QUIZ) {
      await this.practiceScheduleModel
        .findOneAndUpdate(
          { userId: uId, dateKey, 'slots.slotKey': 'quick_quiz' },
          {
            $set: {
              'slots.$.done': true,
              'slots.$.score': score,
            },
          },
        )
        .catch(() => null);

      // Recalculate schedule completedCount
      const schedule = await this.practiceScheduleModel.findOne({ userId: uId, dateKey });
      if (schedule) {
        schedule.completedCount = schedule.slots.filter((s) => s.done).length;
        await schedule.save().catch(() => null);
      }

      // Mark DailyPlan item 'complete_quiz' as done if present
      const plan = await this.dailyPlanModel.findOne({ userId: uId, dateKey });
      if (plan) {
        const quizItem = plan.items.find((item) => item.key === 'complete_quiz');
        if (quizItem && !quizItem.done) {
          quizItem.done = true;
          quizItem.doneAt = new Date();
          plan.completedCount = plan.items.filter((i) => i.done).length;
          await plan.save().catch(() => null);
        }
      }
    }

    return {
      attemptId,
      quizId: quiz._id.toString(),
      quizTitle: quiz.title,
      score,
      passed,
      passingScorePercent: quiz.passingScorePercent,
      pointsAwarded,
      totalQuestions,
      correctQuestions,
      questionsResult,
      completedAt: attempt.completedAt.toISOString(),
    };
  }
}
