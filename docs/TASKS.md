# SOFE Build Tasks (for Antigravity)

Do tasks **in order, one at a time**. Each task ends with: run it, test it, read the diff, commit.

## Prompt template

```
Read AGENT_RULES.md and the spec files listed for this task.
Task: <task id and name>
Goal: <one sentence>
Specs: <docs to follow, for example SCHEMA.md "courses", API.md "Learn", PAGES.md LN4, DESIGN.md components>
Do: <what to build>
Do not: touch files outside <folders>, add libraries without asking, change the schema without asking.
Acceptance: <list from this file>
First give a short plan (files to create or change). Then implement. Finish with how to run and test it.
```

## Definition of done (every task)
- Builds and lints with no errors; TypeScript strict passes.
- Acceptance criteria met and demonstrated (screenshot, test, or curl).
- Guards, validation and tests present for any API change.
- No hard-coded colours or secrets. Loading, empty, error states handled for any UI.
- Committed with a clear message.

## Phase 0. Prepare (you, before coding)
- P0.1 Create GitHub repo, copy this pack, protect `main`.
- P0.2 Create accounts: Firebase, MongoDB Atlas, Vercel, Railway or Render, Expo, Cloudinary, Mux, Razorpay, RevenueCat, Resend, Sentry, PostHog, Apple Developer, Google Play.
- P0.3 Atlas: create dev cluster (M0), database user, IP allow list; save URI in `.env`.
- P0.4 Firebase: enable Google, Apple, Phone, Email/Password; download admin credentials.
- P0.5 Figma: frames named by page ID, components, exports (logo SVG, icons).
- P0.6 Prepare seed content (1 course with videos, 10 articles, 20 questions, 30 quotes).

## Phase 1. Foundation (weeks 2-3)
- **T1.1 Monorepo skeleton.** pnpm workspaces, `apps/mobile`, `apps/admin`, `apps/api`, `packages/shared`, TypeScript base config, ESLint, Prettier, Husky. Acceptance: `pnpm install`, `pnpm lint`, `pnpm build` pass.
- **T1.2 Shared package.** Add `theme.ts`, enums (statuses, roles, permissions), zod schemas folder, error codes. Acceptance: imported by all three apps.
- **T1.3 API skeleton.** NestJS app, config module (validated env), health check, global validation pipe (zod), error envelope, request logging (no PII), Swagger, Sentry. Acceptance: `GET /api/v1/health` returns ok.
- **T1.4 Mongo connection and base models.** Mongoose setup, `users`, `adminUsers`, `auditLogs`, `appConfig` with indexes. Acceptance: app connects to Atlas dev; indexes created by migration.
- **T1.5 Auth module (learner).** Firebase token verification guard, `POST /auth/session`, `GET/PATCH /me`, `@Public/@Auth` decorators, guard-coverage test. Acceptance: valid token creates user; invalid token 401; test fails if a route has no guard.
- **T1.6 Admin auth and RBAC.** `@AdminAuth(permission)`, roles map from `PERMISSIONS.md`, TOTP 2FA setup and verify, audit log interceptor. Acceptance: role matrix tests pass.
- **T1.7 Mobile shell.** Expo app, Expo Router groups (`(auth)`, `(onboarding)`, `(tabs)`), fonts, theme provider (dark and light), tab bar (6 tabs, Network hidden by flag), API client with token refresh, TanStack Query, secure store. Acceptance: tabs navigate; theme tokens only.
- **T1.8 Core UI components.** Button, Card, ProgressBar, ProgressRing, Chip, Avatar, Input/SearchBar, TopTabs, ListRow, BottomSheet, Toast, Skeleton, EmptyState, ErrorState (see `DESIGN.md`). Acceptance: a component gallery screen shows all variants and states; contrast rules respected.
- **T1.9 Admin shell.** Next.js app, theme, sidebar by role, login with Firebase + 2FA (AD1), dashboard placeholder (AD2), DataTable and FormField components. Acceptance: login works; sidebar hides unauthorised items.
- **T1.10 CI and environments.** GitHub Actions (lint, test, build), dev and staging env files, Vercel and API host deploy from branches. Acceptance: push to `develop` deploys staging.

## Phase 2. Onboarding and content engine (weeks 4-6)
- **T2.1 Onboarding screens ON1-ON8.** With Google, Apple, phone OTP, profile setup, goals, personalise, permissions. Acceptance: new user reaches Home; resume works.
- **T2.2 Content models.** `courseCategories`, `instructors`, `courses`, `lessons`, `topics`, `authors`, `articles`, `books`, `videos`, `quotes`, `words` with indexes and seeds.
- **T2.3 Cloudinary and Mux integration.** Signed upload endpoint, Mux direct upload, Mux webhook (verify, idempotent), signed playback tokens service.
- **T2.4 Admin: categories, instructors, authors, topics (CS8, CS9, CS15, CS16).**
- **T2.5 Admin: course CRUD and curriculum (CS1-CS3, CS6).** Publish checklist, versions, audit.
- **T2.6 Admin: lesson editor and video status (CS4, CS5).** Acceptance: upload a video, see it reach `ready`.
- **T2.7 Admin: article editor and list (CS13, CS14).** Tiptap, sanitised HTML, schedule, preview, read time.
- **T2.8 Admin: books and videos (CS10-CS12).**
- **T2.9 Public content API.** Courses list and detail, categories, articles feed and detail, topics, authors, books, videos, with Atlas Search for `q`. Acceptance: pagination, filters, only published content returned.
- **T2.10 Mobile Startup World (SW1-SW7).** Feed, topic tabs, reader, bookmarks, search, topics. Acceptance: matches mockup; saved articles open offline.
- **T2.11 Mobile Learn browse (LN1-LN4, LN14-LN19).** Learn home tabs, catalogue, filters, course detail, books and videos lists and players.
- **T2.12 Enrollment and lesson delivery API.** Enrollments, curriculum, lesson access gate, playback tokens, progress events, completion. Acceptance: unpaid user gets `ENROLLMENT_REQUIRED`; free preview works; progress resumes.
- **T2.13 Mobile course learning (LN7-LN12).** Curriculum, video player with resume, reading, quiz lessons, resources, completion and certificate (flag).
- **T2.14 Admin: seed content check.** Publish the sample course and articles through the admin; verify they appear in the app.

## Phase 3. Home, Profile and Practise (weeks 7-9)
- **T3.1 Home models and API.** `visionBoardItems`, `dailyPlans`, quote and word selection, `GET /home`, plan builder with timezone, plan completion hooks.
- **T3.2 Mobile Home (HM1-HM6).** Greeting, quote, word, vision board, Today's plan, Continue Learning.
- **T3.3 Points ledger and streak service.** `pointsLedger`, `streakDays`, idempotent award function in a transaction, streak calculation with timezones. Acceptance: unit tests for rollover, duplicates, negative balance.
- **T3.4 Quiz engine.** `quizzes`, `practiceAttempts`, `practiceSchedule`, server scoring, `GET /practise/today`, results with explanations.
- **T3.5 Admin: quizzes, import, scheduler, points, rewards (CS17-CS19, CS22-CS24, CS26).**
- **T3.6 Mobile Practise v1 (PR1-PR4, PR12-PR16).** Streak, Today's Practice, quiz play and result, reflection, streak and points history, rewards and redeem.
- **T3.7 Reward redemption.** Transaction from `FLOWS.md` F6 with idempotency and tests.
- **T3.8 Achievements.** Definitions, unlock checks (7 day streak, Quiz Master, Top 10% Learner), admin seed.
- **T3.9 Profile and projects (PF1-PF9).** Progress ring, learning time chart, practice stats, portfolio, achievements, edit profile, projects CRUD with uploads.
- **T3.10 Notifications.** In-app inbox (HM7), Expo push tokens, streak reminder job, deep link handler, settings (PF13), admin push composer (CS29).
- **T3.11 Settings (PF11-PF18).** Account, privacy, purchases list, help, legal, delete account flow.

## Phase 4. Money (weeks 10-11)
- **T4.1 Commerce models.** `orders`, `payments`, `refunds`, `coupons`, `couponRedemptions`, `invoices`, `webhookEvents` with unique indexes.
- **T4.2 Razorpay web checkout.** Create order, payment verification, webhook, fulfilment transaction. Acceptance: test payment creates exactly one enrollment; duplicate webhook ignored.
- **T4.3 RevenueCat in-app purchases.** SDK setup, product mapping, `/orders/iap/confirm`, webhook, restore purchases. Acceptance: sandbox purchase unlocks the course.
- **T4.4 Mobile checkout (LN5, LN6) and purchases (PF15).**
- **T4.5 Free enrollment and points enrollment paths.**
- **T4.6 Invoices and GST.** Numbering per financial year, PDF generation, GST fields.
- **T4.7 Admin: orders, refunds, coupons, invoices (BC2-BC4, BC7, BC8).** Refund transaction and access revocation.
- **T4.8 Admin: revenue and funnel (BC1, BC15, BC16).** `dailyStats` job, exports.
- **T4.9 Leads.** Public lead endpoint with captcha and rate limit, admin pipeline and detail (BC9, BC10), Bigin sync job, Framer form webhook.
- **T4.10 Admin: community basics and support (CU1, CU2, CU10), platform (PL1-PL4, PL6).**
- **T4.11 Admin: remaining launch pages.** AD2 dashboards, AD3 search, AD4, CS27 curation.

## Phase 5. Harden and test (weeks 12-13)
- **T5.1 Security review.** Run the checklist in `PERMISSIONS.md`; guard coverage; NoSQL injection tests; rate limits; get an independent review of auth, access and payments.
- **T5.2 Performance.** Indexes verified with `explain`, list endpoint p95, image sizes, pagination, caching headers; app startup time.
- **T5.3 Offline and resilience.** Saved articles, cached Home, queued progress events, retry states.
- **T5.4 Accessibility pass.** VoiceOver and TalkBack, font scaling, contrast.
- **T5.5 Analytics and monitoring.** PostHog events from `PRD.md`, Sentry releases, alerts on webhook failures.
- **T5.6 Beta.** TestFlight and Google Play internal testing with 20-50 users; fix list.
- **T5.7 Production setup.** Production Atlas cluster with backups and IP allow list, production secrets, migrations, restore test.

## Phase 6. Launch (week 14)
- **L1** Store listings, screenshots, privacy labels, data safety form, account deletion info.
- **L2** Submit iOS and Android; plan for one resubmission.
- **L3** Staged rollout, monitor Sentry and analytics daily for the first week.
- **L4** Marketing site live on Framer with lead form wired to the API.

## Phase 7. v1.5 (after launch)
- **V1** Network models and API (posts, comments, likes, follows, polls, reports, blocks) and moderation rules.
- **V2** Mobile Network (NW1-NW12) and PF10; turn on `networkEnabled`.
- **V3** Admin community pages (CU3-CU9, CU11).
- **V4** Brain games, challenges, match the concept (PR5-PR11, CS20, CS21, CS25).
- **V5** Course reviews (LN13, CS7), article comments (SW8).
- **V6** Remaining admin pages (BC5, BC6, BC11-BC14, CS28, CS30, CS31, PL5).
