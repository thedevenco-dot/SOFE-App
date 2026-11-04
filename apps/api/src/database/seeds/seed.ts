import mongoose, { Connection, Types } from 'mongoose';
import {
  CourseCategory,
  CourseCategorySchema,
  Instructor,
  InstructorSchema,
  Topic,
  TopicSchema,
  Author,
  AuthorSchema,
  Course,
  CourseSchema,
  Lesson,
  LessonSchema,
  Article,
  ArticleSchema,
  Book,
  BookSchema,
  Video,
  VideoSchema,
  Quote,
  QuoteSchema,
  Word,
  WordSchema,
  Achievement,
  AchievementSchema,
} from '../schemas';
import { SEED_CATEGORIES } from './data/categories.data';
import { SEED_INSTRUCTORS } from './data/instructors.data';
import { SEED_TOPICS } from './data/topics.data';
import { SEED_AUTHORS } from './data/authors.data';
import { SAMPLE_COURSE_DATA } from './data/course.data';
import { SEED_ARTICLES } from './data/articles.data';
import { SEED_BOOKS } from './data/books.data';
import { SEED_VIDEOS } from './data/videos.data';
import { SEED_QUOTES } from './data/quotes.data';
import { SEED_WORDS } from './data/words.data';
import { SEED_ACHIEVEMENTS } from './data/achievements.data';

export interface SeedResult {
  categories: number;
  instructors: number;
  topics: number;
  authors: number;
  courses: number;
  lessons: number;
  articles: number;
  books: number;
  videos: number;
  quotes: number;
  words: number;
  achievements?: number;
}

export async function runContentSeed(connection?: Connection): Promise<SeedResult> {
  const conn = connection || mongoose.connection;

  const CategoryModel = conn.model(CourseCategory.name, CourseCategorySchema);
  const InstructorModel = conn.model(Instructor.name, InstructorSchema);
  const TopicModel = conn.model(Topic.name, TopicSchema);
  const AuthorModel = conn.model(Author.name, AuthorSchema);
  const CourseModel = conn.model(Course.name, CourseSchema);
  const LessonModel = conn.model(Lesson.name, LessonSchema);
  const ArticleModel = conn.model(Article.name, ArticleSchema);
  const BookModel = conn.model(Book.name, BookSchema);
  const VideoModel = conn.model(Video.name, VideoSchema);
  const QuoteModel = conn.model(Quote.name, QuoteSchema);
  const WordModel = conn.model(Word.name, WordSchema);
  const AchievementModel = conn.model(Achievement.name, AchievementSchema);

  // 1. Categories
  const categoryMap = new Map<string, Types.ObjectId>();
  for (const cat of SEED_CATEGORIES) {
    const doc = await CategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true },
    );
    categoryMap.set(cat.slug, doc._id as Types.ObjectId);
  }

  // 2. Instructors
  const instructorMap = new Map<string, Types.ObjectId>();
  for (const inst of SEED_INSTRUCTORS) {
    const doc = await InstructorModel.findOneAndUpdate(
      { name: inst.name },
      { $set: inst },
      { upsert: true, new: true },
    );
    instructorMap.set(inst.name, doc._id as Types.ObjectId);
  }

  // 3. Topics
  const topicMap = new Map<string, Types.ObjectId>();
  for (const top of SEED_TOPICS) {
    const doc = await TopicModel.findOneAndUpdate(
      { slug: top.slug },
      { $set: top },
      { upsert: true, new: true },
    );
    topicMap.set(top.slug, doc._id as Types.ObjectId);
  }

  // 4. Authors
  const authorMap = new Map<string, Types.ObjectId>();
  for (const auth of SEED_AUTHORS) {
    const doc = await AuthorModel.findOneAndUpdate(
      { name: auth.name },
      { $set: auth },
      { upsert: true, new: true },
    );
    authorMap.set(auth.name, doc._id as Types.ObjectId);
  }

  // 5. Course with Modules and Lessons
  const primaryCategoryId =
    categoryMap.get('ideation-validation') || Array.from(categoryMap.values())[0];
  const primaryInstructorId =
    instructorMap.get('Aravind Sridhar') || Array.from(instructorMap.values())[0];

  let courseDoc = await CourseModel.findOne({ slug: SAMPLE_COURSE_DATA.slug });
  if (!courseDoc) {
    courseDoc = new CourseModel({
      slug: SAMPLE_COURSE_DATA.slug,
      title: SAMPLE_COURSE_DATA.title,
      subtitle: SAMPLE_COURSE_DATA.subtitle,
      descriptionHtml: SAMPLE_COURSE_DATA.descriptionHtml,
      thumbnailUrl: SAMPLE_COURSE_DATA.thumbnailUrl,
      previewMuxPlaybackId: SAMPLE_COURSE_DATA.previewMuxPlaybackId,
      categoryId: primaryCategoryId,
      tags: SAMPLE_COURSE_DATA.tags,
      level: SAMPLE_COURSE_DATA.level,
      language: SAMPLE_COURSE_DATA.language,
      instructorIds: [primaryInstructorId],
      priceInr: SAMPLE_COURSE_DATA.priceInr,
      compareAtPriceInr: SAMPLE_COURSE_DATA.compareAtPriceInr,
      redeemableWithPoints: SAMPLE_COURSE_DATA.redeemableWithPoints,
      status: SAMPLE_COURSE_DATA.status,
      publishedAt: SAMPLE_COURSE_DATA.publishedAt,
    });
    await courseDoc.save();
  }

  let totalLessonsSeeded = 0;
  const courseModules = [];

  for (const modData of SAMPLE_COURSE_DATA.modules) {
    const moduleId = new Types.ObjectId();
    const lessonIds: Types.ObjectId[] = [];

    for (const lesData of modData.lessons) {
      const lessonDoc = await LessonModel.findOneAndUpdate(
        { courseId: courseDoc._id, title: lesData.title },
        {
          $set: {
            courseId: courseDoc._id,
            moduleId,
            order: lesData.order,
            title: lesData.title,
            type: lesData.type,
            isFreePreview: lesData.isFreePreview,
            isRequired: lesData.isRequired,
            durationSec: lesData.durationSec,
            video: 'video' in lesData ? lesData.video : undefined,
            reading: 'reading' in lesData ? lesData.reading : undefined,
            resource: 'resource' in lesData ? lesData.resource : undefined,
            status: 'published',
          },
        },
        { upsert: true, new: true },
      );
      lessonIds.push(lessonDoc._id as Types.ObjectId);
      totalLessonsSeeded++;
    }

    courseModules.push({
      _id: moduleId,
      title: modData.title,
      order: modData.order,
      lessonIds,
    });
  }

  // Update course with modules and stats
  courseDoc.modules = courseModules as unknown as typeof courseDoc.modules;
  courseDoc.stats = {
    enrolledCount: 42,
    ratingAvg: 4.9,
    ratingCount: 18,
    lessonCount: totalLessonsSeeded,
    durationSec: 2860,
  };
  await courseDoc.save();

  // 6. Articles
  const authorIds = Array.from(authorMap.values());
  const topicIds = Array.from(topicMap.values());
  let articlesSeeded = 0;

  for (let i = 0; i < SEED_ARTICLES.length; i++) {
    const art = SEED_ARTICLES[i];
    const assignedAuthorId = authorIds[i % authorIds.length];
    const assignedTopicId = topicIds[i % topicIds.length];

    await ArticleModel.findOneAndUpdate(
      { slug: art.slug },
      {
        $set: {
          slug: art.slug,
          title: art.title,
          excerpt: art.excerpt,
          bodyHtml: art.bodyHtml,
          coverUrl: art.coverUrl,
          primaryTopicId: assignedTopicId,
          topicIds: [assignedTopicId],
          tags: art.tags,
          authorId: assignedAuthorId,
          readTimeMin: art.readTimeMin,
          featured: art.featured,
          status: 'published',
          publishedAt: new Date(Date.now() - i * 86400000),
          stats: { views: (i + 1) * 125, bookmarks: (i + 1) * 24 },
        },
      },
      { upsert: true, new: true },
    );
    articlesSeeded++;
  }

  // 7. Books
  let booksSeeded = 0;
  for (const book of SEED_BOOKS) {
    await BookModel.findOneAndUpdate(
      { slug: book.slug },
      {
        $set: {
          ...book,
          categoryId: primaryCategoryId,
        },
      },
      { upsert: true, new: true },
    );
    booksSeeded++;
  }

  // 8. Videos
  let videosSeeded = 0;
  for (const vid of SEED_VIDEOS) {
    await VideoModel.findOneAndUpdate(
      { slug: vid.slug },
      {
        $set: {
          ...vid,
          topicIds: [topicIds[0]],
        },
      },
      { upsert: true, new: true },
    );
    videosSeeded++;
  }

  // 9. Quotes
  let quotesSeeded = 0;
  for (const q of SEED_QUOTES) {
    await QuoteModel.findOneAndUpdate(
      { text: q.text },
      {
        $set: {
          text: q.text,
          author: q.author,
          tags: q.tags,
          status: 'published',
        },
      },
      { upsert: true, new: true },
    );
    quotesSeeded++;
  }

  // 10. Words
  let wordsSeeded = 0;
  for (const w of SEED_WORDS) {
    await WordModel.findOneAndUpdate(
      { word: w.word },
      {
        $set: {
          word: w.word,
          meaning: w.meaning,
          status: 'published',
        },
      },
      { upsert: true, new: true },
    );
    wordsSeeded++;
  }

  // 11. Achievements
  let achievementsSeeded = 0;
  for (const a of SEED_ACHIEVEMENTS) {
    await AchievementModel.findOneAndUpdate(
      { key: a.key },
      {
        $set: {
          key: a.key,
          title: a.title,
          description: a.description,
          iconUrl: a.iconUrl,
          tier: a.tier,
          rule: a.rule,
          status: a.status,
          order: a.order,
        },
      },
      { upsert: true, new: true },
    );
    achievementsSeeded++;
  }

  return {
    categories: categoryMap.size,
    instructors: instructorMap.size,
    topics: topicMap.size,
    authors: authorMap.size,
    courses: 1,
    lessons: totalLessonsSeeded,
    articles: articlesSeeded,
    books: booksSeeded,
    videos: videosSeeded,
    quotes: quotesSeeded,
    words: wordsSeeded,
    achievements: achievementsSeeded,
  };
}
