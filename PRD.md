# SOFE Product Requirements (PRD)

Version 1.0 | Owner: Saurabh | Status: ready to build

## 1. Product summary

**SOFE (School of Founder Education)** is a mobile app (iOS and Android) that helps aspiring founders learn, practise and grow every day. Tagline: **Learn - Create - Lead.**

It combines four things in one daily habit:
1. **Learn:** paid and free courses, videos and books.
2. **Practise:** short quizzes, brain games and scenarios that earn points and keep a streak.
3. **Read:** Startup World, a Finshots-style feed of short, sharp business articles.
4. **Network:** a professional social network for founders (v1.5).

Plus a personal layer (quote, manifestation word, vision board, daily plan) and a profile that shows progress and a portfolio of projects.

Reference products: Finshots (concise business reading), Substack (writer-led content and community), Zebra-style reading.

Two web admin areas run the business: **Content Studio** (courses, articles, quizzes, rewards) and **Business Console** (orders, leads, finance), plus Community and Platform tools.

## 2. Goals and non-goals

### Goals (v1)
- A learner can sign up, personalise Home, take a course, practise daily, read articles and see progress.
- The team can publish courses, articles and quizzes without a developer.
- Revenue from course sales is tracked accurately, with GST invoices.
- The app is stable, secure and approved on both stores.

### Non-goals (v1)
- Network (posts, follows, comments, polls): v1.5.
- Brain games, scenario challenges, Match the Concept: v1.5.
- Direct messages, live classes, group chats, subscriptions, multi-language, tablet layouts, web learner app.

## 3. Users

| User | Needs |
|---|---|
| Aspiring founder (core) | Structured learning, a daily habit, credible founder content |
| Early-stage founder | Practical playbooks, peers, a place to show projects |
| Content team (admin) | Easy publishing, scheduling, analytics |
| Sales or support | See leads, orders, answer questions |
| Finance | Revenue, refunds, GST invoices, exports |
| Moderator (v1.5) | Handle reports quickly |

## 4. Scope by tab (acceptance criteria)

Page IDs refer to `PAGES.md`.

### Onboarding (ON1-ON8)
- Sign in with Google, Apple or phone OTP.
- Profile setup captures name, photo (optional), headline. Goals and interests select at least 1.
- Personalise: manifestation word, quote, up to 3 vision board images (all skippable).
- Accept: a new user reaches Home in under 90 seconds. OTP resend after 30 seconds. Sessions persist.

### Home (HM1-HM7)
- Shows greeting by time of day, name, avatar, notification bell with unread badge.
- Quote card and manifestation word are editable; vision board shows up to 3 tiles with Edit.
- Today's plan lists 5 tasks (Watch 1 lesson, Complete 1 quiz, Read 1 article, Work on project, Reflect 2 min) with progress such as 3/5. Tasks tick automatically when the real action is done.
- Continue Learning button opens the last unfinished lesson, or Learn if none.
- Accept: plan resets at local midnight; completing an action ticks the task within 2 seconds; task completion is never counted twice.

### Learn (LN1-LN19)
- Tabs: My Courses, All Courses, Books, Videos. Search and filters.
- Continue Learning card with progress percent and Continue button.
- My Purchased Courses list with lessons count, duration, progress.
- Recommended for You with rating and review count.
- Course detail shows overview, curriculum, free preview lessons, reviews, price and Buy.
- Lesson types: video (Mux, adaptive, resume position), reading, quiz, resources.
- Accept: paid lessons are unreachable without an active enrollment (enforced by the API); progress syncs; video resumes where left; completed course shows completion and certificate (if flag on).

### Practise (PR1-PR16)
- Points chip, rewards icon, learning streak (7-day tracker Mon-Sun).
- Tabs: Daily Practice, Brain Games, Challenges.
- Today's Practice (x/5): Quick Quiz, Brain Game, Scenario Challenge, Match the Concept, Daily Reflection, each with points and a Start button.
- Rewards: points balance, "Earn 500 points to get 1 free course access", redeem.
- v1 delivers Quick Quiz, Daily Reflection, streak, points history and rewards. v1.5 adds the games and challenges.
- Accept: points are added once per activity per day; streak counts a day when at least one activity or lesson is completed; redeeming deducts points and unlocks the course atomically.

### Startup World (SW1-SW8)
- Topic tabs (For You, Latest, Startups, Investing, Markets, and more). Featured article, article list with category tag, read time, author and bookmark.
- Reader with cover image, rich text, author, bookmark, share.
- Accept: feed loads in under 2 seconds on a typical connection; articles open offline if saved.

### Network (NW1-NW12) - v1.5
- Tabs: For You, People, My Network. Composer: Post, Article, Project, Poll.
- Feed cards with like, comment, share, bookmark. SOFE Official posts.
- Accept: report and block exist before launch of this tab; content filter active; admin can remove content.

### Profile (PF1-PF18)
- Header: avatar, name, headline, posts, followers, following (counters hidden until Network is live).
- Tabs: Progress (progress ring, learning time chart for 30 days, practice stats), Portfolio (projects), Achievements (7 Day Streak, Quiz Master, Top 10% Learner and more).
- Settings: account, notifications, privacy, purchases and invoices, help, legal, delete account.
- Accept: account deletion works in-app and removes or anonymises personal data.

## 5. Gamification rules

| Rule | Default |
|---|---|
| Quick Quiz | +10 points (first completion per quiz per day) |
| Brain Game | +10 |
| Scenario Challenge | +20 |
| Match the Concept | +10 |
| Daily Reflection | +5 |
| Lesson completed | +5 (configurable, off by default) |
| Streak day | At least 1 qualifying activity in the user's local day |
| Free course | 500 points |
| Achievements | 7 Day Streak, Quiz Master (50 quizzes), Top 10% Learner (weekly learning time), plus admin-defined badges |

Daily caps stop abuse: each activity type can award points once per day per item.

## 6. Non-functional requirements

- **Performance:** cold start under 3 seconds on a mid-range Android phone; API p95 under 500 ms for list endpoints; images served through Cloudinary with responsive sizes.
- **Offline:** previously opened lessons (when downloads are added), saved articles and the Home plan open without internet; progress syncs when back online.
- **Accessibility:** WCAG AA contrast, 44 pt touch targets, screen reader labels, dynamic type, reduced motion.
- **Security:** see `PERMISSIONS.md`.
- **Privacy:** comply with India's DPDP Act: consent at sign-up, privacy policy, data export and deletion on request, minimal data collection.
- **Reliability:** idempotent payments and webhooks; daily Atlas backups; Sentry alerts.
- **Localisation:** English only in v1; keep strings in a translation file for later.
- **Devices:** iOS 15+ and Android 8+ (confirm against Expo SDK requirements at build time).

## 7. Analytics events (PostHog)

Naming: `snake_case`, past tense. Always include `user_id` (after login), `platform`, `app_version`.

| Event | When | Key properties |
|---|---|---|
| `app_opened` | App foreground | source |
| `signup_started` / `signup_completed` | Auth | method (google, apple, phone) |
| `onboarding_step_completed` | Each ON step | step |
| `course_viewed` | LN4 opened | course_id, source |
| `checkout_started` | LN5 opened | course_id, price, route |
| `purchase_completed` | Order paid | course_id, amount, route |
| `purchase_failed` | Payment error | course_id, reason |
| `lesson_started` / `lesson_completed` | Lesson | course_id, lesson_id, type |
| `course_completed` | Last lesson done | course_id |
| `practice_started` / `practice_completed` | Practise | kind, score, points |
| `points_earned` / `reward_redeemed` | Points | amount, reason |
| `streak_updated` | New streak day | streak_length |
| `article_viewed` / `article_completed` / `article_bookmarked` | Startup World | article_id, topic, percent |
| `plan_task_completed` | Home plan | task_key |
| `notification_opened` | Push tap | type |
| `post_created` / `follow_created` / `report_submitted` | Network (v1.5) | type |
| `account_deleted` | Deletion | none |

Funnel to watch: `signup_completed` to `lesson_started` (activation), then `course_viewed` to `purchase_completed` (conversion), and day-1, day-7, day-30 retention.

## 8. Success metrics (first 90 days, targets to refine)

- Activation: 60% of new users start a lesson or practice within 24 hours.
- Habit: 25% weekly active, 30% of actives hold a 3-day streak.
- Revenue: course conversion rate and revenue per user tracked weekly.
- Quality: crash-free sessions above 99%; store rating 4.3 or higher.

## 9. Release plan

| Release | Scope |
|---|---|
| **v1** (launch) | ON, HM, LN, SW, PF, PR basic, 46 launch admin pages, payments, push, analytics |
| **v1.5** (about 6-8 weeks later) | Network, brain games, challenges, match the concept, course reviews, article comments, followers lists |
| **v2** (ideas) | Subscriptions, DMs, live sessions, communities, certificates verification page, web learner app |

## 10. Risks

- Store rejection over payments or account deletion: follow `FLOWS.md` F3 and F12; allow time for resubmission.
- Security gaps in generated code: independent review of guards and payment code before beta.
- Thin content at launch: seed 3 courses, 30 articles, 40 quiz questions before beta.
- Scope creep: new ideas go to the v1.5 or v2 list, not into v1.

## 11. Open items to confirm

Network connection model (follow-only assumed), book format (PDF or summary assumed), final payment route (in-app purchase plus web assumed), additional palette colours.
