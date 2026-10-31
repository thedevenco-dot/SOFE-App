import mongoose from 'mongoose';
import {
  User,
  UserSchema,
  AdminUser,
  AdminUserSchema,
  AuditLog,
  AuditLogSchema,
  AppConfig,
  AppConfigSchema,
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
  WebhookEvent,
  WebhookEventSchema,
  Enrollment,
  EnrollmentSchema,
} from '../schemas';

export async function createAllIndexes() {
  const uri = process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/sofe_dev';
  const dbName = process.env['MONGODB_DB_NAME'] || 'sofe_dev';

  console.log(`Connecting to MongoDB at ${uri} (db: ${dbName})...`);
  await mongoose.connect(uri, {
    dbName,
    retryWrites: true,
  });

  console.log('Connected to MongoDB.');

  const models = [
    { name: 'users', model: mongoose.model(User.name, UserSchema) },
    { name: 'adminUsers', model: mongoose.model(AdminUser.name, AdminUserSchema) },
    { name: 'auditLogs', model: mongoose.model(AuditLog.name, AuditLogSchema) },
    { name: 'appConfig', model: mongoose.model(AppConfig.name, AppConfigSchema) },
    { name: 'courseCategories', model: mongoose.model(CourseCategory.name, CourseCategorySchema) },
    { name: 'instructors', model: mongoose.model(Instructor.name, InstructorSchema) },
    { name: 'topics', model: mongoose.model(Topic.name, TopicSchema) },
    { name: 'authors', model: mongoose.model(Author.name, AuthorSchema) },
    { name: 'courses', model: mongoose.model(Course.name, CourseSchema) },
    { name: 'lessons', model: mongoose.model(Lesson.name, LessonSchema) },
    { name: 'articles', model: mongoose.model(Article.name, ArticleSchema) },
    { name: 'books', model: mongoose.model(Book.name, BookSchema) },
    { name: 'videos', model: mongoose.model(Video.name, VideoSchema) },
    { name: 'quotes', model: mongoose.model(Quote.name, QuoteSchema) },
    { name: 'words', model: mongoose.model(Word.name, WordSchema) },
    { name: 'webhookEvents', model: mongoose.model(WebhookEvent.name, WebhookEventSchema) },
    { name: 'enrollments', model: mongoose.model(Enrollment.name, EnrollmentSchema) },
  ];

  console.log('\nCreating/syncing indexes for all collections:');
  for (const { name, model } of models) {
    console.log(`\nEnsuring indexes on collection: ${name}...`);
    await model.createIndexes();
    const indexes = await model.collection.indexes();
    for (const idx of indexes) {
      console.log(
        `  - Index "${idx.name}":`,
        JSON.stringify(idx.key),
        idx.unique ? '[UNIQUE]' : '',
        idx.sparse ? '[SPARSE]' : '',
      );
    }
  }

  console.log('\nMigration complete: all indexes created successfully.');
  await mongoose.disconnect();
}

if (require.main === module) {
  createAllIndexes().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
