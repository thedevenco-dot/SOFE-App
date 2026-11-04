import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { AdminTaxonomyModule } from './admin/taxonomy/admin-taxonomy.module';
import { AdminCoursesModule } from './admin/courses/admin-courses.module';
import { AdminLessonsModule } from './admin/lessons/admin-lessons.module';
import { AdminArticlesModule } from './admin/articles/admin-articles.module';
import { AdminBooksModule } from './admin/books/admin-books.module';
import { AdminVideosModule } from './admin/videos/admin-videos.module';
import { AdminPracticeModule } from './admin/practice/admin-practice.module';
import { ContentModule } from './content/content.module';
import { LearningModule } from './learning/learning.module';
import { HomeModule } from './home/home.module';
import { PointsModule } from './points/points.module';
import { PracticeModule } from './practice/practice.module';
import { RewardsModule } from './rewards/rewards.module';
import { AchievementsModule } from './achievements/achievements.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    CryptoModule,
    AuthModule,
    UsersModule,
    AdminModule,
    AdminTaxonomyModule,
    AdminCoursesModule,
    AdminLessonsModule,
    AdminArticlesModule,
    AdminBooksModule,
    AdminVideosModule,
    AdminPracticeModule,
    ContentModule,
    LearningModule,
    HomeModule,
    PointsModule,
    PracticeModule,
    RewardsModule,
    AchievementsModule,
    HealthModule,
    MediaModule,
    WebhooksModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
