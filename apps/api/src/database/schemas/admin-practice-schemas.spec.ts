import { RewardSchema } from './reward.schema';
import { GlobalPracticeScheduleSchema } from './global-practice-schedule.schema';
import { ReflectionPromptSchema } from './reflection-prompt.schema';

describe('Admin Practice Schemas Index Declarations (Task T3.5)', () => {
  it('RewardSchema declares required indexes', () => {
    const indexes = RewardSchema.indexes();
    const hasStatusCostIndex = indexes.some(
      ([fields]) => fields.status === 1 && fields.costPoints === 1,
    );
    expect(hasStatusCostIndex).toBe(true);
  });

  it('GlobalPracticeScheduleSchema declares compound unique index { dateKey: 1 }', () => {
    const indexes = GlobalPracticeScheduleSchema.indexes();
    const uniqueDateIndex = indexes.find(
      ([fields, options]) => fields.dateKey === 1 && options?.unique === true,
    );
    expect(uniqueDateIndex).toBeDefined();
  });

  it('ReflectionPromptSchema declares required indexes', () => {
    const indexes = ReflectionPromptSchema.indexes();
    const hasActiveOrderIndex = indexes.some(
      ([fields]) => fields.active === 1 && fields.order === 1,
    );
    expect(hasActiveOrderIndex).toBe(true);
  });
});
