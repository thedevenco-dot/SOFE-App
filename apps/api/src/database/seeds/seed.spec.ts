import { Types } from 'mongoose';
import { runContentSeed } from './seed';

describe('Seed Runner (runContentSeed)', () => {
  it('should execute idempotent upserts across all 11 collections', async () => {
    const mockFindOneAndUpdate = jest.fn().mockImplementation((_query, update) => {
      return Promise.resolve({
        _id: new Types.ObjectId(),
        ...(update.$set || {}),
      });
    });

    const mockFindOne = jest.fn().mockResolvedValue(null);

    const mockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue(true),
    }));

    const mockModelObj = mockModel as unknown as {
      findOneAndUpdate: typeof mockFindOneAndUpdate;
      findOne: typeof mockFindOne;
    };
    mockModelObj.findOneAndUpdate = mockFindOneAndUpdate;
    mockModelObj.findOne = mockFindOne;

    const mockConnection = {
      model: jest.fn().mockReturnValue(mockModelObj),
    } as unknown as Parameters<typeof runContentSeed>[0];

    const result = await runContentSeed(mockConnection);

    expect(result.categories).toBe(5);
    expect(result.instructors).toBe(3);
    expect(result.topics).toBe(6);
    expect(result.authors).toBe(3);
    expect(result.courses).toBe(1);
    expect(result.lessons).toBe(6);
    expect(result.articles).toBe(10);
    expect(result.books).toBe(3);
    expect(result.videos).toBe(3);
    expect(result.quotes).toBe(30);
    expect(result.words).toBe(20);

    // Verify findOneAndUpdate was called with upsert: true
    expect(mockFindOneAndUpdate).toHaveBeenCalled();
    const allCalls = mockFindOneAndUpdate.mock.calls;
    for (const call of allCalls) {
      const options = call[2];
      expect(options).toEqual(expect.objectContaining({ upsert: true }));
    }
  });
});
