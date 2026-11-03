import { QuizSchema } from './quiz.schema';
import { PracticeAttemptSchema } from './practice-attempt.schema';
import { PracticeScheduleSchema } from './practice-schedule.schema';

describe('Quiz & Practice Schemas Index Declarations (Task T3.4)', () => {
  it('QuizSchema declares expected indexes', () => {
    const indexes = QuizSchema.indexes();
    const hasStatusKindIndex = indexes.some(
      ([fields]) =>
        (fields.status === 1 && fields.kind === 1) || (fields.kind === 1 && fields.status === 1),
    );
    expect(hasStatusKindIndex).toBe(true);

    const hasLessonIndex = indexes.some(([fields]) => fields.lessonId === 1);
    expect(hasLessonIndex).toBe(true);
  });

  it('PracticeAttemptSchema declares required indexes', () => {
    const indexes = PracticeAttemptSchema.indexes();
    const hasUserCreatedIndex = indexes.some(
      ([fields]) => fields.userId === 1 && fields.createdAt === -1,
    );
    expect(hasUserCreatedIndex).toBe(true);

    const hasUserQuizIndex = indexes.some(
      ([fields]) => fields.userId === 1 && fields.quizId === 1 && fields.createdAt === -1,
    );
    expect(hasUserQuizIndex).toBe(true);
  });

  it('PracticeScheduleSchema declares compound unique index { userId: 1, dateKey: 1 }', () => {
    const indexes = PracticeScheduleSchema.indexes();
    const compoundUniqueIndex = indexes.find(
      ([fields, options]) =>
        fields.userId === 1 && fields.dateKey === 1 && options?.unique === true,
    );
    expect(compoundUniqueIndex).toBeDefined();
  });
});
