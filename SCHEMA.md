# SOFE Database Schema (MongoDB Atlas + Mongoose)

## 1. Conventions

- Database names: `sofe_dev`, `sofe_staging`, `sofe_prod` (separate clusters or at least separate databases and database users per environment).
- Collection names are camelCase plural. Mongoose models are PascalCase singular.
- Every document has `_id: ObjectId`, `createdAt`, `updatedAt` (Mongoose `timestamps: true`). Soft-deletable documents also have `deletedAt: Date | null`.
- **Money:** integer **paise** (`priceInr`, `amountPaise`), currency `INR`. Never floats.
- **Dates:** stored in UTC. Day-based logic uses `dateKey: 'YYYY-MM-DD'` in the user's timezone (default `Asia/Kolkata`).
- **References:** `ObjectId` with `ref`. IDs sent to clients are strings.
- **Enums:** defined once in `packages/shared` and used by both zod and Mongoose.
- **Rich text:** stored as Tiptap JSON (`bodyJson`) plus a sanitised HTML copy (`bodyHtml`) for rendering.
- **Embed vs reference:** embed data that is read together and bounded (course module outline, quiz questions); reference anything that grows without bound (lessons, posts, comments, likes, progress, ledger).
- **Transactions:** use `session.withTransaction` for order fulfilment, refunds, reward redemption and any multi-collection points change. Atlas replica sets support this.
- **Validation:** zod at the API boundary, Mongoose schema validation in the model. Reject unknown fields (`strict: 'throw'` in dev).
- **Search:** Atlas Search indexes on `articles`, `courses`, `books`, `videos`, `users`, `posts` (see section 8).
- Fields marked `?` are optional. `U` = unique, `UC` = unique compound.

## 2. Identity and admin

### users
`firebaseUid` (U), `email?`, `phone?`, `name`, `username?` (U sparse), `avatarUrl?`, `headline?`, `bio?`, `timezone` (default `Asia/Kolkata`), `interests: string[]`, `goals: string[]`, `manifestationWord?`, `quote: { text, author?, source: 'library'|'custom', quoteId? }?`, `status: 'active'|'suspended'|'deleted'`, `isVerifiedFounder: boolean`, `onboardingCompletedAt?`, `counters: { posts, followers, following }`, `pointsBalance` (cached; ledger is the truth), `streak: { current, longest, lastActiveDateKey }`, `planPreferences: { enabledTaskKeys: string[] }`, `settings: { notifications: { streakReminder, newContent, social, marketing }, reminderTime: 'HH:mm', profileVisibility: 'public'|'followers'|'private' }`, `pushTokens: [{ token, platform: 'ios'|'android', lastSeenAt }]`, `lastLoginAt`, `deletedAt?`, `deletionScheduledFor?`.
Indexes: `{firebaseUid:1}` U; `{username:1}` U sparse; `{email:1}` sparse; `{status:1, createdAt:-1}`; Atlas Search on name, username, headline.

### adminUsers
`firebaseUid` (U), `email` (U), `name`, `roles: ('super_admin'|'content_editor'|'moderator'|'sales_support'|'finance')[]`, `status: 'active'|'disabled'`, `twoFactorEnabled`, `totpSecretEnc?` (encrypted with `FIELD_ENCRYPTION_KEY`), `lastLoginAt`, `invitedBy`.

### auditLogs (append-only)
`actorAdminId`, `actorEmail`, `action` (for example `course.publish`), `entityType`, `entityId`, `before?`, `after?` (changed fields only, no secrets), `ip`, `userAgent`, `createdAt`.
Indexes: `{entityType:1, entityId:1, createdAt:-1}`; `{actorAdminId:1, createdAt:-1}`. No updates or deletes allowed by the API.

## 3. Learning

### courses
`slug` (U), `title`, `subtitle?`, `descriptionJson`, `descriptionHtml`, `thumbnailUrl`, `previewMuxPlaybackId?`, `categoryId`, `tags: string[]`, `level: 'beginner'|'intermediate'|'advanced'`, `language: 'en'`, `instructorIds: ObjectId[]`, `priceInr` (paise, 0 = free), `compareAtPriceInr?`, `iapProductIds: { ios?, android? }`, `redeemableWithPoints: boolean`, `status: 'draft'|'review'|'published'|'archived'`, `scheduledAt?`, `publishedAt?`, `modules: [{ _id, title, order, lessonIds: ObjectId[] }]` (outline), `stats: { enrolledCount, ratingAvg, ratingCount, lessonCount, durationSec }`, `seo?`, `createdBy`, `updatedBy`, `version: number`.
Indexes: `{slug:1}` U; `{status:1, publishedAt:-1}`; `{categoryId:1, status:1}`; `{tags:1}`; Atlas Search on title, subtitle, tags.

### lessons
`courseId`, `moduleId`, `order`, `title`, `type: 'video'|'reading'|'quiz'|'resource'`, `isFreePreview`, `isRequired` (counts toward completion), `status: 'draft'|'published'`, `durationSec?`, video: `mux: { assetId, playbackId, status: 'uploading'|'processing'|'ready'|'errored' }?`, reading: `bodyJson?`, `bodyHtml?`, quiz: `quizId?`, resource: `resources: [{ title, url, kind: 'pdf'|'link'|'file' }]`.
Indexes: `{courseId:1, moduleId:1, order:1}`; `{courseId:1, status:1}`.

### courseCategories
`name` (U), `slug` (U), `order`, `iconUrl?`.

### instructors
`name`, `title?`, `bio?`, `avatarUrl?`, `links: string[]`, `userId?`.

### enrollments
`userId`, `courseId`, `source: 'purchase'|'points'|'admin'|'free'`, `orderId?`, `redemptionId?`, `status: 'active'|'completed'|'revoked'`, `progress: { completedLessonCount, percent, lastLessonId?, lastAccessedAt? }`, `completedAt?`, `revokedAt?`, `revokedReason?`.
Indexes: `{userId:1, courseId:1}` **UC**; `{userId:1, status:1, 'progress.lastAccessedAt':-1}`; `{courseId:1}`.

### lessonProgress
`userId`, `courseId`, `lessonId`, `status: 'in_progress'|'completed'`, `watchedSec`, `percent`, `quizScore?`, `completedAt?`, `lastEventAt`.
Indexes: `{userId:1, lessonId:1}` **UC**; `{userId:1, courseId:1}`.

### courseReviews (v1.5)
`userId`, `courseId`, `rating: 1..5`, `body?`, `status: 'pending'|'approved'|'rejected'`. Indexes: `{userId:1, courseId:1}` UC; `{courseId:1, status:1, createdAt:-1}`.

### certificates
`userId`, `courseId`, `code` (U), `pdfUrl`, `issuedAt`. Index `{userId:1, courseId:1}` U.

### books
`slug` (U), `title`, `author`, `coverUrl`, `descriptionJson?`, `format: 'pdf'|'summary'`, `fileUrl?` (private Cloudinary resource), `summaryJson?`, `categoryId?`, `tags`, `isFree`, `priceInr?`, `status`, `publishedAt`.

### videos (standalone)
`slug` (U), `title`, `description?`, `thumbnailUrl`, `mux: { assetId, playbackId, status }`, `durationSec`, `topicIds`, `isFree`, `status`, `publishedAt`.

### bookmarks
`userId`, `targetType: 'article'|'course'|'book'|'video'|'post'`, `targetId`. Index: `{userId:1, targetType:1, targetId:1}` **UC**; `{userId:1, createdAt:-1}`.

## 4. Startup World

### articles
`slug` (U), `title`, `excerpt`, `bodyJson`, `bodyHtml`, `coverUrl`, `coverAlt?`, `topicIds: ObjectId[]`, `primaryTopicId`, `tags`, `authorId` (`authors`), `readTimeMin`, `status: 'draft'|'review'|'scheduled'|'published'|'archived'`, `scheduledAt?`, `publishedAt?`, `featured: boolean`, `seo: { title?, description? }`, `stats: { views, bookmarks }`, `createdBy`, `version`.
Indexes: `{slug:1}` U; `{status:1, publishedAt:-1}`; `{status:1, primaryTopicId:1, publishedAt:-1}`; `{featured:1, publishedAt:-1}`; Atlas Search on title, excerpt, tags.

### topics
`name` (U), `slug` (U), `order`, `isTab: boolean` (shown as a feed tab), `description?`.

### authors
`name`, `title?`, `bio?`, `avatarUrl?`, `userId?`.

### articleReads
`userId`, `articleId`, `percent`, `completedAt?`, `lastReadAt`. Index `{userId:1, articleId:1}` UC; `{userId:1, lastReadAt:-1}`.

### topicFollows
`userId`, `topicId`. Index `{userId:1, topicId:1}` UC.

## 5. Practise and engagement

### quizzes
`title`, `kind: 'quick_quiz'|'lesson_quiz'`, `topicId?`, `questions: [{ _id, type: 'single'|'multi'|'true_false', prompt, options: [{ _id, text }], correctOptionIds: ObjectId[], explanation, hint? }]`, `pointsReward`, `timeLimitSec?`, `status: 'draft'|'published'|'archived'`.
Never return `correctOptionIds` to the client before submission.

### games (v1.5)
`type: 'match_concept'|'memory'|'sequence'|'speed'`, `title`, `config: object` (validated per type), `pointsReward`, `status`.

### challenges (v1.5)
`title`, `intro`, `steps: [{ _id, prompt, options: [{ _id, text, outcome, scoreDelta }] }]`, `pointsReward`, `startsAt?`, `endsAt?`, `status`.

### practiceSchedule
`dateKey` (U), `slots: [{ key: 'quick_quiz'|'brain_game'|'scenario_challenge'|'match_concept'|'daily_reflection', refType: 'quiz'|'game'|'challenge'|'prompt', refId, points }]`.

### practiceAttempts
`userId`, `dateKey`, `slotKey`, `refType`, `refId`, `status: 'in_progress'|'completed'`, `answers: object[]`, `score`, `maxScore`, `pointsAwarded`, `startedAt`, `completedAt?`.
Indexes: `{userId:1, dateKey:1, slotKey:1}`; `{userId:1, refId:1, createdAt:-1}`.

### reflections
`userId`, `dateKey`, `promptId?`, `text`, `pointsAwarded`. Index `{userId:1, dateKey:1}` UC.

### pointsLedger (append-only)
`userId`, `amount` (positive earn, negative spend), `reason: 'quiz'|'game'|'challenge'|'match'|'reflection'|'lesson'|'streak_bonus'|'redeem'|'admin_adjust'|'refund_reversal'`, `refType?`, `refId?`, `idempotencyKey` (U), `balanceAfter`, `note?`, `createdBy?` (admin).
Indexes: `{idempotencyKey:1}` U; `{userId:1, createdAt:-1}`.
Rule: write the ledger row and update `users.pointsBalance` in one transaction; the balance must never go below zero.

### streakDays
`userId`, `dateKey`, `activityCount`. Index `{userId:1, dateKey:1}` UC.

### rewards
`title`, `type: 'course_access'|'coupon'|'badge'`, `costPoints`, `courseId?`, `couponId?`, `stock?`, `status: 'active'|'inactive'`.

### rewardRedemptions
`userId`, `rewardId`, `costPoints`, `ledgerId`, `enrollmentId?`, `status: 'completed'|'reversed'`. Index `{userId:1, createdAt:-1}`.

### achievements (definitions)
`key` (U), `title`, `description`, `iconUrl`, `tier: 'bronze'|'silver'|'gold'`, `rule: { type: 'streak_days'|'quizzes_completed'|'learning_time_percentile'|'courses_completed'|'manual', threshold }`, `status`.

### userAchievements
`userId`, `achievementId`, `unlockedAt`. Index `{userId:1, achievementId:1}` UC.

### quotes / words / reflectionPrompts
`quotes`: `text`, `author?`, `tags`, `status`. `words`: `word` (U), `meaning?`, `status`. `reflectionPrompts`: `text`, `status`.

## 6. Home and profile

### visionBoardItems
`userId`, `imageUrl`, `caption`, `order`. Index `{userId:1, order:1}`. Max 12 per user.

### dailyPlans
`userId`, `dateKey`, `items: [{ key: 'watch_lesson'|'complete_quiz'|'read_article'|'work_project'|'reflect', label, done, doneAt?, refId? }]`, `completedCount`. Index `{userId:1, dateKey:1}` UC.

### homeCuration
`slot` (U: `featured_courses`|`recommended_courses`|`featured_articles`|`startup_world_hero`), `items: [{ refType, refId, order }]`, `updatedBy`.

### banners
`title`, `body?`, `ctaLabel?`, `deepLink?`, `audience: object`, `startsAt`, `endsAt`, `status`, `dismissible`.

### projects
`userId`, `title`, `summary`, `status: 'draft'|'published'`, `coverUrl?`, `files: [{ name, url, size }]`, `links: string[]`, `tags`, `visibility: 'public'|'followers'|'private'`. Index `{userId:1, updatedAt:-1}`.

## 7. Network (v1.5; create the models now, build the features later)

### posts
`authorId`, `type: 'post'|'article'|'project'|'poll'`, `body`, `title?` (articles), `media: [{ url, kind: 'image', width, height }]`, `projectId?`, `poll?: { options: [{ _id, text, votes }], multi: boolean, endsAt }`, `visibility: 'public'|'followers'`, `isOfficial: boolean`, `counts: { likes, comments, shares }`, `status: 'active'|'hidden'|'removed'`, `removedReason?`.
Indexes: `{status:1, createdAt:-1}`; `{authorId:1, createdAt:-1}`; Atlas Search on body, title.

### comments
`targetType: 'post'|'article'`, `targetId`, `authorId`, `parentId?`, `body`, `counts: { likes }`, `status`. Index `{targetType:1, targetId:1, createdAt:1}`.

### likes
`userId`, `targetType: 'post'|'comment'`, `targetId`. UC `{userId, targetType, targetId}`.

### follows
`followerId`, `followingId`. UC `{followerId, followingId}`; `{followingId:1}`.

### pollVotes
`postId`, `userId`, `optionIds`. UC `{postId, userId}`.

### reports
`reporterId`, `targetType: 'post'|'comment'|'user'`, `targetId`, `reason: 'spam'|'abuse'|'misinformation'|'other'`, `details?`, `status: 'open'|'dismissed'|'actioned'`, `action?: 'removed'|'warned'|'suspended'`, `handledBy?`, `resolvedAt?`. Index `{status:1, createdAt:1}`.

### blocks
`userId`, `blockedUserId`. UC.

### connections (reserved, not built in v1.5)
`requesterId`, `recipientId`, `status`.

## 8. Commerce

### orders
`orderNo` (U, for example `SOFE-2026-000123`), `userId`, `items: [{ type: 'course'|'book', refId, title, pricePaise }]`, `subtotalPaise`, `discountPaise`, `couponId?`, `taxableAmountPaise`, `gst: { ratePercent, amountPaise, placeOfSupply? }`, `totalPaise`, `currency: 'INR'`, `source: 'razorpay'|'apple'|'google'|'points'|'admin'`, `status: 'created'|'pending'|'paid'|'failed'|'cancelled'|'partially_refunded'|'refunded'`, `razorpayOrderId?` (U sparse), `revenueCatTransactionId?` (U sparse), `paidAt?`, `invoiceId?`, `utm?`.
Indexes: `{orderNo:1}` U; `{userId:1, createdAt:-1}`; `{status:1, paidAt:-1}`.

### payments
`orderId`, `provider: 'razorpay'|'apple'|'google'`, `providerPaymentId` (U), `status: 'captured'|'failed'|'refunded'`, `amountPaise`, `method?`, `feePaise?`, `feeTaxPaise?`, `capturedAt?`, `raw?` (sanitised provider payload).
For store purchases record the store commission when known (`storeCommissionPaise`).

### refunds
`orderId`, `paymentId`, `amountPaise`, `reason`, `status: 'requested'|'processed'|'failed'`, `providerRefundId?` (U sparse), `processedBy` (admin).

### webhookEvents (idempotency)
`provider: 'razorpay'|'revenuecat'|'mux'|'bigin'`, `eventId` (U with provider), `type`, `payload`, `status: 'received'|'processed'|'failed'`, `error?`, `processedAt?`. TTL index on `createdAt` after 180 days.

### coupons
`code` (U, uppercase), `type: 'percent'|'flat'`, `value`, `maxRedemptions?`, `perUserLimit` (default 1), `validFrom`, `validTo`, `appliesToCourseIds: ObjectId[]` (empty = all), `status`.
### couponRedemptions
`couponId`, `userId`, `orderId`. UC `{couponId, orderId}`.

### invoices
`invoiceNo` (U, sequential per financial year, for example `SOFE/26-27/0001`), `orderId` (U), `userId`, `billing: { name, email, gstin?, address?, state? }`, `lines: [{ title, hsnSac?, amountPaise }]`, `taxes: { cgstPaise, sgstPaise, igstPaise }`, `totalPaise`, `pdfUrl`, `issuedAt`. Confirm GST treatment with your accountant.

### subscriptions (reserved, v2)
`userId`, `plan`, `status`, `currentPeriodEnd`, `provider`.

## 9. Growth, support and operations

### leads
`name`, `email?`, `phone?`, `source: 'framer_form'|'in_app'|'webinar'|'referral'|'manual'|'import'`, `utm: { source?, medium?, campaign?, content? }`, `stage: 'new'|'contacted'|'demo'|'negotiation'|'won'|'lost'`, `lostReason?`, `assignedTo?`, `userId?`, `valuePaise?`, `tags`, `nextFollowUpAt?`, `bigin: { contactId?, dealId?, syncedAt? }`.
Indexes: `{stage:1, assignedTo:1}`; `{email:1}` sparse; `{createdAt:-1}`.

### leadActivities
`leadId`, `type: 'note'|'call'|'email'|'task'|'stage_change'`, `body`, `byAdminId`, `dueAt?`, `doneAt?`. Index `{leadId:1, createdAt:-1}`.

### campaigns / expenses / payouts
`campaigns`: `name`, `channel`, `spendPaise`, `startDate`, `endDate`, `utmCampaign`. `expenses`: `category`, `amountPaise`, `date`, `vendor?`, `notes?`, `receiptUrl?`. `payouts`: `payeeType: 'instructor'|'affiliate'`, `payeeId`, `periodStart`, `periodEnd`, `amountPaise`, `status: 'pending'|'paid'`, `paidAt?`, `reference?`.

### notifications (in-app inbox)
`userId`, `type`, `title`, `body`, `data: { deepLink? }`, `readAt?`. Index `{userId:1, createdAt:-1}`; TTL 90 days.

### pushCampaigns / notificationTemplates
`pushCampaigns`: `title`, `body`, `deepLink?`, `segment: object`, `scheduledAt?`, `sentAt?`, `stats: { targeted, sent, opened }`, `createdBy`, `status`. `notificationTemplates`: `key` (U), `title`, `body`, `deepLink?`.

### supportTickets
`userId?`, `email`, `subject`, `messages: [{ from: 'user'|'admin', body, at, adminId? }]`, `status: 'open'|'pending'|'closed'`, `assignedTo?`.

### appConfig
`key` (U), `value`, `updatedBy`. Keys: `networkEnabled`, `certificatesEnabled`, `minAppVersion: { ios, android }`, `maintenanceMode: { enabled, message }`, `pointsRules`, `streakRules`, `redeemCostDefault`.

### legalDocuments
`type: 'terms'|'privacy'`, `version`, `bodyJson`, `publishedAt`. UC `{type, version}`.

### contentVersions
`entityType`, `entityId`, `version`, `snapshot`, `byAdminId`, `createdAt`. Index `{entityType:1, entityId:1, version:-1}`.

### dailyStats (rollups for dashboards)
`dateKey` (U), `signups`, `activeUsers`, `lessonsCompleted`, `practiceCompleted`, `ordersPaid`, `revenuePaise`, `refundsPaise`. Written by a nightly job.

## 10. Atlas setup

- **Clusters:** M0 free for dev only. Staging and production on dedicated tiers (M10 or higher), region close to users (for example Mumbai, ap-south-1). Check current Atlas pricing.
- **Access:** database users per environment with least privilege (readWrite on one database). Network access list restricted to the API host IPs; never `0.0.0.0/0` in production.
- **Backups:** turn on continuous cloud backup for production; test a restore before launch.
- **Atlas Search indexes:** `articles` (title, excerpt, tags), `courses` (title, subtitle, tags), `books`, `videos`, `users` (name, username, headline), `posts` (body, title). Use autocomplete on titles for search-as-you-type.
- **TTL indexes:** `notifications` (90 days), `webhookEvents` (180 days).
- **Encryption:** at rest is on by default. Encrypt `totpSecretEnc` in the application layer.
- **Connection:** one shared Mongoose connection per API instance, pool size tuned (start at 20), `retryWrites=true`.
- **Migrations:** use `migrate-mongo` (or similar) for index creation and data changes; run in CI before deploy. Never rely on `autoIndex` in production.
- **Seeding:** `pnpm seed` creates topics, categories, quotes, words, achievements, rewards, one sample course, 10 articles, 20 quiz questions, an admin user.

## 11. Critical transactions

1. **Fulfil paid order:** order `pending` to `paid`; insert `payments`; upsert `enrollments` (UC prevents duplicates); create `invoices`; increment `courses.stats.enrolledCount`; mark `couponRedemptions`. All in one transaction, triggered only from a verified webhook or verified store confirmation.
2. **Award points:** insert `pointsLedger` (idempotency key) and update `users.pointsBalance` with `$inc`; if the key exists, do nothing.
3. **Redeem reward:** check balance, insert negative ledger row, create `rewardRedemptions` and `enrollments`, in one transaction. Reverse by a refund-type ledger row.
4. **Refund:** insert `refunds`, update `orders.status`, revoke `enrollments`, reverse points if the order used points.
5. **Complete practice attempt:** score on the server, update `practiceAttempts`, `streakDays`, `dailyPlans`, ledger; idempotent per attempt.
6. **Delete account:** set `users.status = 'deleted'`, anonymise personal fields, remove push tokens, delete vision board and reflections after the grace period, keep orders and invoices with minimal details.
