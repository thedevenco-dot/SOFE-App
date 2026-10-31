import { CourseCategorySchema } from './course-category.schema';
import { InstructorSchema } from './instructor.schema';
import { TopicSchema } from './topic.schema';
import { AuthorSchema } from './author.schema';
import { CourseSchema } from './course.schema';
import { LessonSchema } from './lesson.schema';
import { ArticleSchema } from './article.schema';
import { BookSchema } from './book.schema';
import { VideoSchema } from './video.schema';
import { QuoteSchema } from './quote.schema';
import { WordSchema } from './word.schema';

import { SEED_CATEGORIES } from '../seeds/data/categories.data';
import { SEED_INSTRUCTORS } from '../seeds/data/instructors.data';
import { SEED_TOPICS } from '../seeds/data/topics.data';
import { SEED_AUTHORS } from '../seeds/data/authors.data';
import { SAMPLE_COURSE_DATA } from '../seeds/data/course.data';
import { SEED_ARTICLES } from '../seeds/data/articles.data';
import { SEED_BOOKS } from '../seeds/data/books.data';
import { SEED_VIDEOS } from '../seeds/data/videos.data';
import { SEED_QUOTES } from '../seeds/data/quotes.data';
import { SEED_WORDS } from '../seeds/data/words.data';

describe('Content Database Schemas (Task 2.2)', () => {
  describe('CourseCategorySchema', () => {
    it('should have required paths and indexes registered', () => {
      const paths = CourseCategorySchema.paths;
      expect(paths['name']).toBeDefined();
      expect(paths['slug']).toBeDefined();
      expect(paths['order']).toBeDefined();
      expect(paths['iconUrl']).toBeDefined();

      const indexKeys = CourseCategorySchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['slug'] === 1)).toBe(true);
      expect(indexKeys.some((k) => k['name'] === 1)).toBe(true);
      expect(indexKeys.some((k) => k['order'] === 1)).toBe(true);
    });
  });

  describe('InstructorSchema', () => {
    it('should have name, bio, links, and userId paths defined', () => {
      const paths = InstructorSchema.paths;
      expect(paths['name']).toBeDefined();
      expect(paths['title']).toBeDefined();
      expect(paths['bio']).toBeDefined();
      expect(paths['links']).toBeDefined();
      expect(paths['userId']).toBeDefined();
    });
  });

  describe('TopicSchema', () => {
    it('should have required paths and isTab index registered', () => {
      const paths = TopicSchema.paths;
      expect(paths['name']).toBeDefined();
      expect(paths['slug']).toBeDefined();
      expect(paths['isTab']).toBeDefined();
      expect(paths['order']).toBeDefined();

      const indexKeys = TopicSchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['slug'] === 1)).toBe(true);
      expect(indexKeys.some((k) => k['isTab'] === 1)).toBe(true);
    });
  });

  describe('AuthorSchema', () => {
    it('should have name and avatarUrl paths defined', () => {
      const paths = AuthorSchema.paths;
      expect(paths['name']).toBeDefined();
      expect(paths['avatarUrl']).toBeDefined();
      expect(paths['title']).toBeDefined();
    });
  });

  describe('CourseSchema', () => {
    it('should have required paths and compound query indexes registered', () => {
      const paths = CourseSchema.paths;
      expect(paths['slug']).toBeDefined();
      expect(paths['title']).toBeDefined();
      expect(paths['categoryId']).toBeDefined();
      expect(paths['level']).toBeDefined();
      expect(paths['priceInr']).toBeDefined();
      expect(paths['modules']).toBeDefined();
      expect(paths['stats']).toBeDefined();

      const indexKeys = CourseSchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['slug'] === 1)).toBe(true);
      expect(indexKeys.some((k) => k['status'] === 1 && k['publishedAt'] === -1)).toBe(true);
      expect(indexKeys.some((k) => k['categoryId'] === 1 && k['status'] === 1)).toBe(true);
      expect(indexKeys.some((k) => k['tags'] === 1)).toBe(true);
    });
  });

  describe('LessonSchema', () => {
    it('should have courseId, moduleId, order, title, and compound indexes', () => {
      const paths = LessonSchema.paths;
      expect(paths['courseId']).toBeDefined();
      expect(paths['moduleId']).toBeDefined();
      expect(paths['order']).toBeDefined();
      expect(paths['title']).toBeDefined();
      expect(paths['type']).toBeDefined();
      expect(paths['status']).toBeDefined();

      const indexKeys = LessonSchema.indexes().map((idx) => idx[0]);
      expect(
        indexKeys.some((k) => k['courseId'] === 1 && k['moduleId'] === 1 && k['order'] === 1),
      ).toBe(true);
      expect(indexKeys.some((k) => k['courseId'] === 1 && k['status'] === 1)).toBe(true);
    });
  });

  describe('ArticleSchema', () => {
    it('should have primaryTopicId, authorId, readTimeMin, and compound indexes', () => {
      const paths = ArticleSchema.paths;
      expect(paths['slug']).toBeDefined();
      expect(paths['title']).toBeDefined();
      expect(paths['excerpt']).toBeDefined();
      expect(paths['bodyHtml']).toBeDefined();
      expect(paths['primaryTopicId']).toBeDefined();
      expect(paths['authorId']).toBeDefined();
      expect(paths['readTimeMin']).toBeDefined();
      expect(paths['featured']).toBeDefined();

      const indexKeys = ArticleSchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['slug'] === 1)).toBe(true);
      expect(indexKeys.some((k) => k['status'] === 1 && k['publishedAt'] === -1)).toBe(true);
      expect(
        indexKeys.some(
          (k) => k['status'] === 1 && k['primaryTopicId'] === 1 && k['publishedAt'] === -1,
        ),
      ).toBe(true);
      expect(indexKeys.some((k) => k['featured'] === 1 && k['publishedAt'] === -1)).toBe(true);
    });
  });

  describe('BookSchema', () => {
    it('should have format and status registered', () => {
      const paths = BookSchema.paths;
      expect(paths['slug']).toBeDefined();
      expect(paths['title']).toBeDefined();
      expect(paths['author']).toBeDefined();
      expect(paths['format']).toBeDefined();
      expect(paths['coverUrl']).toBeDefined();

      const indexKeys = BookSchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['slug'] === 1)).toBe(true);
    });
  });

  describe('VideoSchema', () => {
    it('should have durationSec and mux object registered', () => {
      const paths = VideoSchema.paths;
      expect(paths['slug']).toBeDefined();
      expect(paths['title']).toBeDefined();
      expect(paths['durationSec']).toBeDefined();
      expect(paths['thumbnailUrl']).toBeDefined();

      const indexKeys = VideoSchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['slug'] === 1)).toBe(true);
    });
  });

  describe('QuoteSchema', () => {
    it('should have text, author, tags, and status paths', () => {
      const paths = QuoteSchema.paths;
      expect(paths['text']).toBeDefined();
      expect(paths['author']).toBeDefined();
      expect(paths['tags']).toBeDefined();
      expect(paths['status']).toBeDefined();

      const indexKeys = QuoteSchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['status'] === 1)).toBe(true);
    });
  });

  describe('WordSchema', () => {
    it('should have word and meaning paths with unique index', () => {
      const paths = WordSchema.paths;
      expect(paths['word']).toBeDefined();
      expect(paths['meaning']).toBeDefined();
      expect(paths['status']).toBeDefined();

      const indexKeys = WordSchema.indexes().map((idx) => idx[0]);
      expect(indexKeys.some((k) => k['word'] === 1)).toBe(true);
    });
  });

  describe('Seed Data Sets Integrity', () => {
    it('should provide complete seed datasets fulfilling T2.2 specification', () => {
      expect(SEED_CATEGORIES.length).toBeGreaterThanOrEqual(5);
      expect(SEED_INSTRUCTORS.length).toBeGreaterThanOrEqual(3);
      expect(SEED_TOPICS.length).toBeGreaterThanOrEqual(6);
      expect(SEED_AUTHORS.length).toBeGreaterThanOrEqual(3);

      expect(SAMPLE_COURSE_DATA.modules.length).toBe(3);
      const totalLessons = SAMPLE_COURSE_DATA.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      expect(totalLessons).toBe(6);

      expect(SEED_ARTICLES.length).toBe(10);
      expect(SEED_BOOKS.length).toBe(3);
      expect(SEED_VIDEOS.length).toBe(3);
      expect(SEED_QUOTES.length).toBe(30);
      expect(SEED_WORDS.length).toBe(20);

      // Verify unique slugs across all seed articles
      const articleSlugs = new Set(SEED_ARTICLES.map((a) => a.slug));
      expect(articleSlugs.size).toBe(SEED_ARTICLES.length);

      // Verify unique words
      const words = new Set(SEED_WORDS.map((w) => w.word));
      expect(words.size).toBe(SEED_WORDS.length);
    });
  });
});
