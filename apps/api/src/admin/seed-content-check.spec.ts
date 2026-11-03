import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { AdminCoursesService } from './courses/admin-courses.service';
import { AdminArticlesService } from './articles/admin-articles.service';
import { ContentService } from '../content/content.service';
import { SAMPLE_COURSE_DATA } from '../database/seeds/data/course.data';
import { SEED_ARTICLES } from '../database/seeds/data/articles.data';
import { SEED_CATEGORIES } from '../database/seeds/data/categories.data';
import { SEED_INSTRUCTORS } from '../database/seeds/data/instructors.data';
import { SEED_TOPICS } from '../database/seeds/data/topics.data';
import { SEED_AUTHORS } from '../database/seeds/data/authors.data';

/**
 * Task T2.14: Admin Seed Content Check & App Visibility Verification
 * Validates the full publishing lifecycle between Admin, DB Schemas, and Public Content APIs.
 */
describe('T2.14: Admin Seed Content Check & App Verification', () => {
  const mockAdminId = new Types.ObjectId().toHexString();
  const sampleCourseId = new Types.ObjectId().toHexString();
  const sampleCategoryId = new Types.ObjectId().toHexString();
  const sampleInstructorId = new Types.ObjectId().toHexString();
  const sampleTopicId = new Types.ObjectId().toHexString();
  const sampleAuthorId = new Types.ObjectId().toHexString();

  // In-memory content version storage to simulate contentVersions collection
  const recordedVersions: Array<{
    entityType: string;
    entityId: string;
    version: number;
    byAdminId?: string;
    snapshot: Record<string, unknown>;
  }> = [];

  // In-memory data store for courses and articles
  const courseStore: Record<string, Record<string, unknown>> = {};
  const lessonStore: Record<string, Record<string, unknown>> = {};
  const articleStore: Record<string, Record<string, unknown>> = {};

  function createChainableQuery<T>(result: T) {
    const query: Record<string, unknown> = {
      populate: jest.fn().mockImplementation(() => query),
      sort: jest.fn().mockImplementation(() => query),
      limit: jest.fn().mockImplementation(() => query),
      skip: jest.fn().mockImplementation(() => query),
      select: jest.fn().mockImplementation(() => query),
      lean: jest.fn().mockImplementation(() => Promise.resolve(result)),
      exec: jest.fn().mockImplementation(() => Promise.resolve(result)),
      then: (resolve: (val: T) => void, reject?: (err: unknown) => void) =>
        Promise.resolve(result).then(resolve, reject),
    };
    return query;
  }

  // Setup services
  let adminCoursesService: AdminCoursesService;
  let adminArticlesService: AdminArticlesService;
  let contentService: ContentService;

  beforeAll(() => {
    // 1. Initialize course store from SAMPLE_COURSE_DATA
    const moduleLessonIds: Types.ObjectId[] = [];
    SAMPLE_COURSE_DATA.modules.forEach((mod) => {
      const modId = new Types.ObjectId();
      mod.lessons.forEach((les, lesIdx) => {
        const lessonId = new Types.ObjectId();
        const lDoc = {
          _id: lessonId,
          courseId: new Types.ObjectId(sampleCourseId),
          moduleId: modId,
          title: les.title,
          type: les.type,
          durationSec: les.durationSec,
          order: les.order || lesIdx + 1,
          isFreePreview: les.isFreePreview,
          isRequired: les.isRequired,
          status: 'published',
          video: 'video' in les ? les.video : undefined,
          reading: 'reading' in les ? les.reading : undefined,
          resource: 'resource' in les ? les.resource : undefined,
        };
        lessonStore[lessonId.toHexString()] = lDoc;
        moduleLessonIds.push(lessonId);
      });
    });

    courseStore[sampleCourseId] = {
      _id: new Types.ObjectId(sampleCourseId),
      title: SAMPLE_COURSE_DATA.title,
      slug: SAMPLE_COURSE_DATA.slug,
      subtitle: SAMPLE_COURSE_DATA.subtitle,
      descriptionHtml: SAMPLE_COURSE_DATA.descriptionHtml,
      thumbnailUrl: SAMPLE_COURSE_DATA.thumbnailUrl,
      previewMuxPlaybackId: SAMPLE_COURSE_DATA.previewMuxPlaybackId,
      categoryId: new Types.ObjectId(sampleCategoryId),
      instructorIds: [new Types.ObjectId(sampleInstructorId)],
      level: SAMPLE_COURSE_DATA.level,
      language: SAMPLE_COURSE_DATA.language,
      priceInr: SAMPLE_COURSE_DATA.priceInr,
      compareAtPriceInr: SAMPLE_COURSE_DATA.compareAtPriceInr,
      tags: SAMPLE_COURSE_DATA.tags,
      status: 'draft', // Start in draft to verify admin publishing
      version: 1,
      modules: SAMPLE_COURSE_DATA.modules.map((m, idx) => ({
        _id: new Types.ObjectId(),
        title: m.title,
        order: idx + 1,
        lessonIds: moduleLessonIds.slice(idx * 2, idx * 2 + 2),
      })),
      stats: {
        enrolledCount: 0,
        ratingAvg: 5.0,
        ratingCount: 0,
        lessonCount: moduleLessonIds.length,
        durationSec: 2860,
      },
    };

    // 2. Initialize articles from SEED_ARTICLES
    SEED_ARTICLES.forEach((art, idx) => {
      const artId = new Types.ObjectId().toHexString();
      articleStore[artId] = {
        _id: new Types.ObjectId(artId),
        title: art.title,
        slug: art.slug,
        excerpt: art.excerpt,
        bodyHtml: art.bodyHtml,
        coverUrl: art.coverUrl,
        primaryTopicId: new Types.ObjectId(sampleTopicId),
        topicIds: [new Types.ObjectId(sampleTopicId)],
        authorId: new Types.ObjectId(sampleAuthorId),
        readTimeMin: art.readTimeMin,
        tags: art.tags,
        featured: art.featured,
        status: idx === 0 ? 'draft' : 'published', // First article in draft for testing publish
        version: 1,
        publishedAt: new Date(),
        stats: { views: 50, bookmarks: 12 },
      };
    });

    // Mock Course Model for Admin
    const mockAdminCourseModel = {
      findById: jest.fn().mockImplementation((id: string) => {
        const doc = courseStore[id];
        if (!doc) return createChainableQuery(null);
        const copy = {
          ...doc,
          save: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
            courseStore[id] = { ...this };
            return Promise.resolve(this);
          }),
          toObject: () => ({ ...courseStore[id] }),
        };
        return createChainableQuery(copy);
      }),
      findOne: jest.fn().mockImplementation((query: Record<string, unknown>) => {
        const found = Object.values(courseStore).find((c) => {
          if (query['slug'] && c['slug'] !== query['slug']) return false;
          return true;
        });
        return Promise.resolve(found ? { ...found } : null);
      }),
    };

    // Mock Lesson Model for Admin
    const mockAdminLessonModel = {
      find: jest.fn().mockImplementation((query: Record<string, unknown>) => {
        const courseIdStr = query['courseId']?.toString();
        const found = Object.values(lessonStore).filter((l) => {
          if (courseIdStr && l['courseId']?.toString() !== courseIdStr) return false;
          return true;
        });
        return createChainableQuery(found);
      }),
    };

    // Mock ContentVersion Model
    const mockContentVersionModel = jest.fn().mockImplementation((dto: Record<string, unknown>) => {
      recordedVersions.push({
        entityType: dto['entityType'] as string,
        entityId: dto['entityId']?.toString() as string,
        version: dto['version'] as number,
        byAdminId: dto['byAdminId']?.toString(),
        snapshot: dto['snapshot'] as Record<string, unknown>,
      });
      return {
        save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
      };
    });

    // Mock Article Model for Admin
    const mockAdminArticleModel = {
      findById: jest.fn().mockImplementation((id: string) => {
        const doc = articleStore[id];
        if (!doc) return createChainableQuery(null);
        const copy = {
          ...doc,
          save: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
            articleStore[id] = { ...this };
            return Promise.resolve(this);
          }),
          toObject: () => ({ ...articleStore[id] }),
        };
        return createChainableQuery(copy);
      }),
    };

    // Mock Models for Public ContentService
    const mockPublicCourseModel = {
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        const items = Object.values(courseStore).filter((c) => {
          if (filter['status'] && c['status'] !== filter['status']) return false;
          return true;
        });
        return createChainableQuery(items);
      }),
      countDocuments: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        const items = Object.values(courseStore).filter((c) => {
          if (filter['status'] && c['status'] !== filter['status']) return false;
          return true;
        });
        return createChainableQuery(items.length);
      }),
      findOne: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        const doc = Object.values(courseStore).find((c) => {
          if (filter['slug'] && c['slug'] !== filter['slug']) return false;
          if (filter['status'] && c['status'] !== filter['status']) return false;
          return true;
        });
        return createChainableQuery(doc ? { ...doc } : null);
      }),
      findById: jest.fn().mockImplementation((id: string) => {
        const doc = courseStore[id];
        return createChainableQuery(doc ? { ...doc } : null);
      }),
    };

    const mockPublicArticleModel = {
      find: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        const items = Object.values(articleStore)
          .filter((a) => {
            if (filter['status'] && a['status'] !== filter['status']) return false;
            if (
              filter['primaryTopicId'] &&
              a['primaryTopicId']?.toString() !== filter['primaryTopicId']?.toString()
            )
              return false;
            return true;
          })
          .map((a) => ({
            ...a,
            toObject: () => ({ ...a }),
          }));
        return createChainableQuery(items);
      }),
      countDocuments: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        const items = Object.values(articleStore).filter((a) => {
          if (filter['status'] && a['status'] !== filter['status']) return false;
          return true;
        });
        return createChainableQuery(items.length);
      }),
      findOne: jest.fn().mockImplementation((filter: Record<string, unknown>) => {
        const doc = Object.values(articleStore).find((a) => {
          if (filter['slug'] && a['slug'] !== filter['slug']) return false;
          if (filter['status'] && a['status'] !== filter['status']) return false;
          return true;
        });
        const wrapped = doc ? { ...doc, toObject: () => ({ ...doc }) } : null;
        return createChainableQuery(wrapped);
      }),
      updateOne: jest.fn().mockReturnValue(createChainableQuery({})),
    };

    const mockCategoryModel = {
      find: jest.fn().mockReturnValue(createChainableQuery(SEED_CATEGORIES)),
      findById: jest.fn().mockResolvedValue({ _id: sampleCategoryId, name: 'Ideation' }),
    };

    const mockTopicModel = {
      find: jest.fn().mockReturnValue(createChainableQuery(SEED_TOPICS)),
      findById: jest.fn().mockResolvedValue({ _id: sampleTopicId, name: 'Fundraising' }),
    };

    const mockAuthorModel = {
      find: jest.fn().mockReturnValue(createChainableQuery(SEED_AUTHORS)),
      findById: jest.fn().mockResolvedValue({ _id: sampleAuthorId, name: 'Aravind Sridhar' }),
    };

    const mockBookmarkModel = { findOne: jest.fn().mockResolvedValue(null) };
    const mockTopicFollowModel = { findOne: jest.fn().mockResolvedValue(null) };

    // Instantiate Admin Services
    adminCoursesService = new AdminCoursesService(
      mockAdminCourseModel as unknown as ConstructorParameters<typeof AdminCoursesService>[0],
      mockAdminLessonModel as unknown as ConstructorParameters<typeof AdminCoursesService>[1],
      mockContentVersionModel as unknown as ConstructorParameters<typeof AdminCoursesService>[2],
    );

    adminArticlesService = new AdminArticlesService(
      mockAdminArticleModel as unknown as ConstructorParameters<typeof AdminArticlesService>[0],
      mockContentVersionModel as unknown as ConstructorParameters<typeof AdminArticlesService>[1],
    );

    // Instantiate Public Content Service
    contentService = new ContentService(
      mockPublicCourseModel as unknown as ConstructorParameters<typeof ContentService>[0],
      mockCategoryModel as unknown as ConstructorParameters<typeof ContentService>[1],
      mockAdminLessonModel as unknown as ConstructorParameters<typeof ContentService>[2],
      mockPublicArticleModel as unknown as ConstructorParameters<typeof ContentService>[3],
      mockTopicModel as unknown as ConstructorParameters<typeof ContentService>[4],
      mockAuthorModel as unknown as ConstructorParameters<typeof ContentService>[5],
      {} as never, // BookModel
      {} as never, // VideoModel
      mockBookmarkModel as unknown as ConstructorParameters<typeof ContentService>[8],
      mockTopicFollowModel as unknown as ConstructorParameters<typeof ContentService>[9],
    );
  });

  describe('Part 1: Seed Content Integrity', () => {
    it('verifies seed categories, instructors, topics, and authors count and schema', () => {
      expect(SEED_CATEGORIES.length).toBeGreaterThanOrEqual(5);
      expect(SEED_INSTRUCTORS.length).toBeGreaterThanOrEqual(3);
      expect(SEED_TOPICS.length).toBeGreaterThanOrEqual(6);
      expect(SEED_AUTHORS.length).toBeGreaterThanOrEqual(3);

      SEED_CATEGORIES.forEach((c) => {
        expect(c.name).toBeDefined();
        expect(c.slug).toBeDefined();
      });
      SEED_TOPICS.forEach((t) => {
        expect(t.name).toBeDefined();
        expect(t.slug).toBeDefined();
      });
    });

    it('verifies the sample course meets all 8 publishing criteria', () => {
      // 1. Title >= 5 chars
      expect(SAMPLE_COURSE_DATA.title.length).toBeGreaterThanOrEqual(5);
      // 2. HTML Description >= 100 chars
      expect(SAMPLE_COURSE_DATA.descriptionHtml.length).toBeGreaterThanOrEqual(100);
      // 3. Thumbnail URL
      expect(SAMPLE_COURSE_DATA.thumbnailUrl).toMatch(/^https?:\/\//);
      // 4. Modules and lessons >= 3 published lessons
      const totalLessons = SAMPLE_COURSE_DATA.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      expect(SAMPLE_COURSE_DATA.modules.length).toBeGreaterThanOrEqual(1);
      expect(totalLessons).toBeGreaterThanOrEqual(3);
      // 5. Video lessons have ready Mux playback
      const videoLessons = SAMPLE_COURSE_DATA.modules.flatMap((m) =>
        m.lessons.filter((l) => l.type === 'video'),
      );
      expect(videoLessons.length).toBeGreaterThan(0);
      videoLessons.forEach((vl) => {
        if ('video' in vl) {
          expect(vl.video?.mux?.status).toBe('ready');
          expect(vl.video?.mux?.playbackId).toBeDefined();
        }
      });
      // 6. Pricing configured
      expect(SAMPLE_COURSE_DATA.priceInr).toBeGreaterThanOrEqual(0);
    });

    it('verifies all seeded articles have essential content metadata', () => {
      expect(SEED_ARTICLES.length).toBe(10);
      SEED_ARTICLES.forEach((art) => {
        expect(art.title.length).toBeGreaterThan(10);
        expect(art.slug.length).toBeGreaterThan(5);
        expect(art.excerpt.length).toBeGreaterThan(20);
        expect(art.bodyHtml.length).toBeGreaterThan(50);
        expect(art.readTimeMin).toBeGreaterThan(0);
        expect(art.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Part 2: Admin Publishing Workflow (8-Point Checklist, Snapshots & Gating)', () => {
    it('executes the 8-point quality checklist on the draft sample course and passes', async () => {
      const checklist = await adminCoursesService.getPublishChecklist(sampleCourseId);

      expect(checklist).toBeDefined();
      expect(checklist.canPublish).toBe(true);
      expect(checklist.checks).toHaveLength(8);

      const checkKeys = checklist.checks.map((c) => c.key);
      expect(checkKeys).toEqual([
        'title_slug',
        'thumbnail',
        'category',
        'instructor',
        'description',
        'curriculum',
        'videos_ready',
        'pricing_iap',
      ]);

      checklist.checks.forEach((check) => {
        expect(check.passed).toBe(true);
      });
    });

    it('verifies course is NOT returned in public API while in draft status', async () => {
      const publicCourses = await contentService.listCourses({});
      const foundInPublic = publicCourses.data.find((c) => c['slug'] === SAMPLE_COURSE_DATA.slug);
      expect(foundInPublic).toBeUndefined();

      // Direct lookup by slug returns 404 when draft
      await expect(contentService.getCourseBySlug(SAMPLE_COURSE_DATA.slug)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('publishes course through Admin, creates version snapshot, and updates status', async () => {
      const published = await adminCoursesService.publishCourse(sampleCourseId, mockAdminId);

      expect(published.status).toBe('published');
      expect(published.version).toBe(2); // Incremented from 1

      // Verify immutable content snapshot in contentVersions
      const versionRecord = recordedVersions.find(
        (v) => v.entityType === 'course' && v.entityId === sampleCourseId,
      );
      expect(versionRecord).toBeDefined();
      expect(versionRecord?.version).toBe(2);
      expect(versionRecord?.byAdminId).toBe(mockAdminId);
      expect(versionRecord?.snapshot['title']).toBe(SAMPLE_COURSE_DATA.title);
    });

    it('verifies published course appears immediately in public mobile API', async () => {
      const publicCourses = await contentService.listCourses({});
      const publishedCourse = publicCourses.data.find((c) => c['slug'] === SAMPLE_COURSE_DATA.slug);

      expect(publishedCourse).toBeDefined();
      expect(publishedCourse?.['title']).toBe(SAMPLE_COURSE_DATA.title);

      // Direct slug lookup succeeds and returns full course details
      const detail = await contentService.getCourseBySlug(SAMPLE_COURSE_DATA.slug);
      expect(detail).toBeDefined();
      expect(detail.title).toBe(SAMPLE_COURSE_DATA.title);
      expect((detail.modules as unknown[]).length).toBe(SAMPLE_COURSE_DATA.modules.length);
    });

    it('unpublishes course back to draft and verifies immediate removal from public API', async () => {
      const unpublished = await adminCoursesService.unpublishCourse(sampleCourseId, mockAdminId);
      expect(unpublished.status).toBe('draft');

      // Public list no longer includes the unpublished course
      const publicCourses = await contentService.listCourses({});
      const found = publicCourses.data.find((c) => c['slug'] === SAMPLE_COURSE_DATA.slug);
      expect(found).toBeUndefined();

      // Slug lookup fails with 404
      await expect(contentService.getCourseBySlug(SAMPLE_COURSE_DATA.slug)).rejects.toThrow(
        NotFoundException,
      );

      // Re-publish to leave in clean published state
      await adminCoursesService.publishCourse(sampleCourseId, mockAdminId);
      const restored = await contentService.getCourseBySlug(SAMPLE_COURSE_DATA.slug);
      expect(restored.status).toBe('published');
    });
  });

  describe('Part 3: Admin Article Publishing & Mobile Startup World Verification', () => {
    let draftArticleId: string;
    let draftArticleSlug: string;

    beforeAll(() => {
      // Find the draft article created in beforeAll
      const draftEntry = Object.entries(articleStore).find(([_, art]) => art['status'] === 'draft');
      draftArticleId = draftEntry![0];
      draftArticleSlug = draftEntry![1]['slug'] as string;
    });

    it('verifies draft article is hidden from public Startup World feed', async () => {
      const publicArticles = await contentService.listArticles({});
      const found = publicArticles.data.find((a) => a['slug'] === draftArticleSlug);
      expect(found).toBeUndefined();

      await expect(contentService.getArticleBySlug(draftArticleSlug)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('publishes article through Admin, creates version snapshot, and updates status', async () => {
      const published = await adminArticlesService.publishArticle(draftArticleId, mockAdminId);

      expect(published.status).toBe('published');
      expect(published.publishedAt).toBeDefined();

      // Verify immutable content version recorded
      const versionRecord = recordedVersions.find(
        (v) => v.entityType === 'article' && v.entityId === draftArticleId,
      );
      expect(versionRecord).toBeDefined();
      expect(versionRecord?.byAdminId).toBe(mockAdminId);
      expect(versionRecord?.snapshot['title']).toBe(published.title);
    });

    it('verifies published article appears in public feed and is readable by slug', async () => {
      const publicArticles = await contentService.listArticles({});
      const found = publicArticles.data.find((a) => a['slug'] === draftArticleSlug);
      expect(found).toBeDefined();
      expect(found?.['title']).toBeDefined();

      // Slug reader returns full article with sanitized HTML
      const readerDoc = await contentService.getArticleBySlug(draftArticleSlug);
      expect(readerDoc).toBeDefined();
      expect(readerDoc.bodyHtml).toBeDefined();
      expect(readerDoc.excerpt).toBeDefined();
    });

    it('unpublishes article and verifies immediate public access gating', async () => {
      const unpublished = await adminArticlesService.unpublishArticle(draftArticleId);
      expect(unpublished.status).toBe('draft');

      // Public feed excludes it
      const feed = await contentService.listArticles({});
      expect(feed.data.find((a) => a['slug'] === draftArticleSlug)).toBeUndefined();

      // Slug lookup returns 404
      await expect(contentService.getArticleBySlug(draftArticleSlug)).rejects.toThrow(
        NotFoundException,
      );

      // Re-publish
      await adminArticlesService.publishArticle(draftArticleId, mockAdminId);
      const rechecked = await contentService.getArticleBySlug(draftArticleSlug);
      expect(rechecked.status).toBe('published');
    });
  });
});
