import { VisionBoardItemSchema } from './vision-board-item.schema';
import { DailyPlanSchema } from './daily-plan.schema';

describe('Home Database Schemas (Task T3.1)', () => {
  describe('VisionBoardItemSchema', () => {
    it('should have required paths and compound index registered', () => {
      const paths = VisionBoardItemSchema.paths;
      expect(paths['userId']).toBeDefined();
      expect(paths['imageUrl']).toBeDefined();
      expect(paths['caption']).toBeDefined();
      expect(paths['order']).toBeDefined();

      const indexes = VisionBoardItemSchema.indexes();
      const hasOrderIndex = indexes.some(
        ([fields]) => fields['userId'] === 1 && fields['order'] === 1,
      );
      expect(hasOrderIndex).toBe(true);
    });
  });

  describe('DailyPlanSchema', () => {
    it('should have required paths and unique compound index registered', () => {
      const paths = DailyPlanSchema.paths;
      expect(paths['userId']).toBeDefined();
      expect(paths['dateKey']).toBeDefined();
      expect(paths['items']).toBeDefined();
      expect(paths['completedCount']).toBeDefined();

      const indexes = DailyPlanSchema.indexes();
      const uniqueCompoundIndex = indexes.find(
        ([fields, options]) =>
          fields['userId'] === 1 && fields['dateKey'] === 1 && options?.unique === true,
      );
      expect(uniqueCompoundIndex).toBeDefined();
    });
  });
});
