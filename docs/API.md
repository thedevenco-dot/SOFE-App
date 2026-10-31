# SOFE REST API

Base URL: `/api/v1`. NestJS, JSON, OpenAPI at `/api/docs` (disabled in production or behind auth).

## 1. Conventions

- **Auth:** `Authorization: Bearer <Firebase ID token>`. The API verifies the token with Firebase Admin, then loads `users` (learner routes) or `adminUsers` (admin routes). Public routes need no token.
- **Guards:** every route is `@Public()`, `@Auth()` or `@AdminAuth('permission')`. See `PERMISSIONS.md`.
- **Headers:** `X-Timezone` (IANA name, learners), `X-App-Version`, `X-Platform` (`ios`|`android`|`web`), `Idempotency-Key` on purchase and redeem calls.
- **Success:** `{ "data": ..., "meta": { "nextCursor": "...", "total": 120 } }` (`meta` only on lists).
- **Error:** `{ "error": { "code": "ENROLLMENT_REQUIRED", "message": "...", "details": {} } }` with the right HTTP status (400, 401, 403, 404, 409, 422, 429, 500).
- **Pagination:** cursor based: `?limit=20&cursor=...` (max limit 50). No offset pagination.
- **Sorting and filters:** documented per endpoint; unknown params rejected.
- **Rate limits:** default 120 requests per minute per user; stricter on auth (10 per minute per IP), OTP, posting, and search (30 per minute).
- **Versioning:** breaking changes go to `/api/v2`.
- **Uploads:** client asks for a signed upload (`POST /uploads/sign`), uploads directly to Cloudinary, then sends the returned URL. Video uploads go straight to Mux with a direct-upload URL created by the admin API.
- **Webhooks** (`/webhooks/*`) are public but must verify the provider signature and are idempotent.

## 2. Learner API

### Auth and session
```
POST   /auth/session            @Public (token in header)  create or load the user after login; returns user + flags
POST   /auth/logout             @Auth                      remove current push token
GET    /config                  @Public                    feature flags, min versions, maintenance
```

### Me (profile and settings)
```
GET    /me                      @Auth     current user
PATCH  /me                      @Auth     name, headline, bio, avatar, interests, goals, quote, manifestationWord
POST   /me/onboarding/complete  @Auth
GET    /me/stats                @Auth     progress %, learning time (30 days), practice stats
GET    /me/settings   PATCH /me/settings
POST   /me/push-token           DELETE /me/push-token
POST   /me/delete               @Auth     start account deletion (re-auth required)
GET    /me/export               @Auth     data export (later)
```

### Home
```
GET    /home                    @Auth     quote, word, vision tiles, plan, continue-learning, banners
GET    /plan/today   PATCH /plan/preferences
GET    /vision        POST /vision   PATCH /vision/:id   DELETE /vision/:id   (max 12)
GET    /quotes        GET /words
GET    /notifications           POST /notifications/read   (ids or all)   GET /notifications/unread-count
```

### Learn
```
GET    /courses                          @Public  list published (q, category, level, price=free|paid, cursor)
GET    /courses/categories               @Public
GET    /courses/recommended              @Auth/@Public
GET    /courses/:slug                    @Public  detail + curriculum outline + free preview flags
GET    /courses/:id/curriculum           @Auth    full outline with my progress (enrolled)
GET    /courses/:id/resources            @Auth    enrolled only
GET    /courses/continue                 @Auth    last unfinished lesson
GET    /enrollments                      @Auth    my courses (status, progress)
GET    /lessons/:id                      @Auth    content; 403 ENROLLMENT_REQUIRED unless enrolled or free preview
POST   /lessons/:id/playback-token       @Auth    Mux signed playback token (enrolled or preview only)
POST   /lessons/:id/progress             @Auth    { watchedSec, percent, completed }
POST   /lessons/:id/quiz/submit          @Auth
POST   /courses/:id/reviews              @Auth    v1.5   GET /courses/:id/reviews @Public
GET    /certificates/:courseId           @Auth
GET    /books   GET /books/:slug         @Public/@Auth (file URL is signed and short lived)
GET    /videos  GET /videos/:slug        @Public/@Auth   POST /videos/:id/playback-token
```

### Commerce
```
POST   /orders                       @Auth  { courseId, couponCode? } create order + Razorpay order (web)
POST   /orders/iap/confirm           @Auth  { courseId, transactionId } verify with RevenueCat; idempotent
GET    /orders   GET /orders/:id     @Auth  my orders
POST   /orders/restore               @Auth  re-sync store purchases
POST   /coupons/validate             @Auth  { code, courseId }
GET    /invoices   GET /invoices/:id/pdf     @Auth
```

### Practise
```
GET    /practise/today               @Auth  today's slots, status, points, streak summary
GET    /quizzes/:id                  @Auth  questions without answers
POST   /quizzes/:id/attempts         @Auth  start; POST /attempts/:id/submit   (server scores)
GET    /attempts/:id                 @Auth  result with explanations
GET    /games  GET /games/:id        @Auth  v1.5       GET /challenges  GET /challenges/:id   v1.5
POST   /reflections   GET /reflections?from&to   @Auth
GET    /streak                       @Auth  current, longest, calendar month
GET    /points                       @Auth  balance + ledger (cursor)
GET    /rewards   POST /rewards/:id/redeem   @Auth  (Idempotency-Key required)
GET    /achievements                 @Auth  all + unlocked
```

### Startup World
```
GET    /articles/feed                @Public/@Auth  For You (followed topics, featured, recent)
GET    /articles                     @Public  topic, q, cursor
GET    /articles/:slug               @Public  + POST /articles/:id/read { percent } @Auth
GET    /topics    POST /topics/:id/follow   DELETE /topics/:id/follow
GET    /authors/:id
GET    /bookmarks   POST /bookmarks   DELETE /bookmarks/:id     @Auth
GET    /search?q=&type=course|article|book|video|user|post       @Public/@Auth
```

### Profile and projects
```
GET    /projects   POST /projects   PATCH /projects/:id   DELETE /projects/:id   @Auth
GET    /users/:id                    @Public/@Auth  public profile (respects privacy)
```

### Network (v1.5, behind `networkEnabled`)
```
GET    /posts/feed   GET /posts/:id   POST /posts   PATCH /posts/:id   DELETE /posts/:id
POST   /posts/:id/like   DELETE /posts/:id/like
POST   /posts/:id/vote                          polls
GET    /comments?targetType&targetId   POST /comments   DELETE /comments/:id
POST   /users/:id/follow   DELETE /users/:id/follow   GET /users/:id/followers   GET /users/:id/following
GET    /users/suggested
POST   /reports   POST /blocks   DELETE /blocks/:userId   GET /blocks
```

### Support, legal, uploads, leads
```
POST   /support/tickets   GET /support/tickets   POST /support/tickets/:id/messages   @Auth
GET    /legal/:type                  @Public   latest terms or privacy
POST   /uploads/sign                 @Auth     { purpose: 'avatar'|'vision'|'project'|'post' } returns Cloudinary signature
POST   /leads                        @Public   (rate limited, captcha token) from Framer form or in-app enquiry
```

### Webhooks
```
POST   /webhooks/razorpay            verify X-Razorpay-Signature; events: payment.captured, payment.failed, refund.processed
POST   /webhooks/revenuecat          verify Authorization header; events: INITIAL_PURCHASE, NON_RENEWING_PURCHASE, REFUND, CANCELLATION
POST   /webhooks/mux                 verify signature; events: video.asset.ready, video.asset.errored
POST   /webhooks/bigin               (if used) two-way lead sync
```
Each handler: verify, insert `webhookEvents` (unique key), process in a transaction, return 200 quickly.

## 3. Admin API (`/admin/*`, all `@AdminAuth(permission)`)

Permission names are in `PERMISSIONS.md`. Every write creates an `auditLogs` entry.

```
POST   /admin/auth/session           create/load admin session; /admin/auth/2fa/setup, /verify
GET    /admin/me   GET /admin/dashboard     role-aware metrics
GET    /admin/search?q=

# Content Studio
CRUD   /admin/courses  (+ POST /:id/publish, /:id/unpublish, /:id/duplicate, /:id/schedule)
PUT    /admin/courses/:id/curriculum        modules + lesson order
CRUD   /admin/lessons      POST /admin/media/video-upload (Mux direct upload URL)   GET /admin/media/video/:assetId
CRUD   /admin/course-categories   /admin/instructors   /admin/books   /admin/videos
CRUD   /admin/articles (+ publish, schedule, feature)   /admin/topics   /admin/authors
CRUD   /admin/quizzes   POST /admin/quizzes/import (CSV)   CRUD /admin/games   /admin/challenges
GET/PUT /admin/practise/schedule?from&to
GET/PUT /admin/config/points-rules       CRUD /admin/rewards   /admin/achievements
CRUD   /admin/quotes  /admin/words  /admin/reflection-prompts
GET/PUT /admin/curation/:slot            CRUD /admin/banners
POST   /admin/push (send or schedule)    GET /admin/push   CRUD /admin/notification-templates
GET    /admin/versions?entityType&entityId     POST /admin/versions/:id/restore

# Community and users
GET    /admin/users  GET /admin/users/:id   PATCH /admin/users/:id/status (suspend, ban)   POST /:id/verify
GET    /admin/reports  GET /:id  POST /:id/action
GET    /admin/posts  DELETE /admin/posts/:id   GET/PUT /admin/moderation-rules
POST   /admin/official/posts
GET    /admin/support/tickets  POST /:id/reply  PATCH /:id

# Business Console
GET    /admin/revenue/summary?from&to   GET /admin/revenue/by-course   /by-source
GET    /admin/orders  GET /:id   POST /admin/orders/manual (admin grant or offline sale)
POST   /admin/orders/:id/refund
GET    /admin/reconciliation   POST /admin/reconciliation/match
CRUD   /admin/coupons
GET    /admin/invoices  GET /:id/pdf   GET /admin/invoices/gst-export?month
CRUD   /admin/leads  PATCH /:id/stage  POST /:id/activities   POST /admin/leads/import
CRUD   /admin/campaigns  /admin/expenses  /admin/payouts
GET    /admin/analytics/funnel   /retention
GET    /admin/reports/export?type=orders|leads|expenses|gst&format=csv|xlsx

# Platform
CRUD   /admin/admins (invite, disable)   GET /admin/roles   PUT /admin/roles/:role
GET    /admin/audit-logs
GET/PUT /admin/app-config/:key
GET    /admin/integrations/status
CRUD   /admin/legal
```

## 4. Error codes (stable strings)

`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `ENROLLMENT_REQUIRED`, `ALREADY_ENROLLED`, `COUPON_INVALID`, `PAYMENT_FAILED`, `ORDER_ALREADY_PAID`, `INSUFFICIENT_POINTS`, `ALREADY_COMPLETED_TODAY`, `CONTENT_BLOCKED`, `ACCOUNT_SUSPENDED`, `FEATURE_DISABLED`, `MAINTENANCE`, `APP_UPDATE_REQUIRED`, `CONFLICT`, `INTERNAL`.

## 5. Background jobs (`@nestjs/schedule`; move to a queue such as BullMQ when volume grows)

| Job | Schedule | What |
|---|---|---|
| Publish scheduled content | Every minute | Flip `scheduled` courses and articles to `published` |
| Streak reminders | Every 15 minutes | Push to users whose reminder time has arrived and who have no activity today |
| Plan builder | On demand and at local midnight | Create `dailyPlans` lazily on first request of the day |
| Nightly stats | 02:00 IST | Write `dailyStats` |
| Account deletion | Daily | Hard-delete accounts past their 30-day grace period |
| Push cleanup | Daily | Remove invalid Expo push tokens |
| Bigin sync | Every 10 minutes | Push new leads, pull stage changes |
| Order reconciliation | Hourly | Re-check `pending` orders older than 30 minutes with Razorpay |
