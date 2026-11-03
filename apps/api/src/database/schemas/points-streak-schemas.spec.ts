import { PointsLedgerSchema } from './points-ledger.schema';
import { StreakDaySchema } from './streak-day.schema';

describe('Points & Streak Schemas Index Declarations (Task T3.3)', () => {
  it('PointsLedgerSchema declares required indexes', () => {
    const indexes = PointsLedgerSchema.indexes();
    expect(indexes.length).toBeGreaterThanOrEqual(1);

    // Verify { userId: 1, createdAt: -1 }
    const hasUserCreatedIndex = indexes.some(
      ([fields]) => fields.userId === 1 && fields.createdAt === -1,
    );
    expect(hasUserCreatedIndex).toBe(true);
  });

  it('StreakDaySchema declares unique compound index { userId: 1, dateKey: 1 }', () => {
    const indexes = StreakDaySchema.indexes();
    const compoundUniqueIndex = indexes.find(
      ([fields, options]) =>
        fields.userId === 1 && fields.dateKey === 1 && options?.unique === true,
    );
    expect(compoundUniqueIndex).toBeDefined();
  });
});
