# SOFE User Flows and State Machines

Page IDs refer to `PAGES.md`. API names refer to `API.md`.

## Part A. Learner flows

### F1. First launch and onboarding
1. ON1 Splash checks for a session. No session goes to ON2; session with `onboardingCompletedAt` goes to HM1; session without it resumes at the first incomplete ON step.
2. ON2 carousel (3 slides) or Skip.
3. ON3: Continue with Google, Apple or phone. Phone goes to ON4 (6-digit OTP, resend after 30 s, max 5 attempts per hour).
4. API: verify Firebase token, create the `users` record if new (`POST /auth/session`).
5. ON5: name (required), photo (optional), headline.
6. ON6: choose at least 1 goal or interest. Feeds recommendations.
7. ON7: manifestation word, quote, up to 3 vision images (skippable).
8. ON8: ask for notification permission (optional), register the push token, create today's plan, go to HM1.
Edge cases: OTP wrong or expired (inline error), social login cancelled (stay on ON3), no network (retry state), Apple hides email (store the private relay address).

### F2. Daily loop
1. HM1 shows greeting, quote, word, vision board and Today's plan (x/5).
2. Tapping a plan task routes by key: `watch_lesson` to the last lesson or LN1; `complete_quiz` to PR2; `read_article` to SW1; `work_project` to PF8; `reflect` to PR12.
3. The server completes a task when the real event happens (lesson completed, quiz attempt completed, article read to 60%, reflection saved, project updated). The app never marks tasks done on its own.
4. Each completion awards points (ledger), updates streak, updates the plan; HM1 refreshes.
5. When 5/5, show a celebration and the streak count.
Edge cases: timezone change (use the device timezone sent in a header, stored on the user), plan shows no task for a feature that is disabled.

### F3. Discover and buy a course
1. LN1, LN2 or LN18, optionally filter or search.
2. LN4 shows overview, curriculum, preview lessons, reviews, price and Buy. Guests are asked to sign in on Buy.
3. LN5: apply a coupon (web route only), choose payment route:
   - **In-app (iOS and Android):** RevenueCat purchase of the course's product. On success the app calls `POST /orders/iap/confirm`; the server also receives the RevenueCat webhook and is the authority.
   - **Web (Razorpay):** `POST /orders` creates an order and Razorpay order; the checkout opens; Razorpay webhook marks it paid.
4. Server marks the order paid in a transaction: create payment, enrollment and invoice, record points if any.
5. LN6 shows success, "Start learning" opens the first lesson.
Edge cases: payment fails (retry), app closed after paying (restore purchases, order check on next launch), duplicate webhook (ignored via `webhookEvents`), price changed during checkout (server re-prices), already enrolled (Buy replaced by Continue).

### F4. Learn a course
1. LN1 Continue Learning, LN7 curriculum, or LN8 directly.
2. Server checks active enrollment (or a free preview lesson) before returning content and a Mux signed playback token.
3. Video: report progress every 15 seconds and on pause or exit; resume from `watchedSec`.
4. Lesson completes at 90% watched, reading scrolled to the end, or quiz submitted. Next lesson autoplays after a short countdown.
5. Course complete: when all required lessons are complete, set enrollment `completed`, issue a certificate (flag), show LN12, prompt for a review (v1.5).
Edge cases: refund revokes access, course archived (existing learners keep access), offline (queue progress events and sync).

### F5. Practise and earn points
1. PR1 shows the streak and Today's Practice, built from the admin schedule for today (`practiceSchedule`).
2. Start an activity (PR3 quiz, PR6 game, PR9 challenge, PR11 match, PR12 reflection).
3. Submit; the server scores answers (the client never decides the score) and returns explanations.
4. Points awarded once per activity per day (`idempotencyKey = userId:activityKey:dateKey`), streak updated, achievements checked.
5. PR4 or equivalent result screen, with points earned and the next activity.
Edge cases: leave mid-quiz (attempt resumes within 24 hours), already done today (done state, no points), no schedule for today (fallback to a default set).

### F6. Redeem rewards
1. PR1 gift icon or Your Rewards, PR15 shows balance and catalogue.
2. Choose reward (for example a free course for 500 points), confirm in PR16.
3. Server transaction: check balance, insert negative ledger entry, create enrollment and `rewardRedemptions`.
4. Success, course appears in My Courses.
Edge cases: not enough points (show the gap), already enrolled (disable), concurrent redeem (one succeeds, enforced by balance check and unique key).

### F7. Read in Startup World
1. SW1 loads the featured article and list; topic tabs filter; SW7 manages followed topics.
2. SW3: open, read; `article_reads` records progress; at 60% the plan task completes.
3. Bookmark (SW5), share (deep link).
4. At the end, related articles and a follow topic prompt.

### F8. Post and engage (v1.5)
1. NW1 composer, pick Post, Article, Project or Poll (NW5-NW8).
2. Content filter runs on the server before saving (keywords, links, spam rate); blocked content returns an error to edit.
3. Others like, comment, share, bookmark; notification to the author.
4. NW9 shows the thread; NW12 reports or blocks.

### F9. Grow the network (v1.5)
1. NW2 People, search (NW11), open a profile (NW10), Follow or Unfollow.
2. NW3 lists following and followers. (Connection requests NW4 reserved for a later model.)

### F10. Build the profile
1. PF1 to PF3 tabs; PF4 edit; PF8 add project (title, summary, files or links, status Draft or Published); achievements unlock automatically.
2. Share profile link (deep link).

### F11. Notifications
Types and deep links:

| Type | Trigger | Deep link |
|---|---|---|
| `streak_reminder` | No activity by the user's reminder time | `sofe://practise` |
| `points_earned` | Points awarded (in-app only) | `sofe://practise/points` |
| `new_course` | Course published (opt-in) | `sofe://course/{slug}` |
| `new_article` | Featured article published | `sofe://article/{slug}` |
| `purchase_confirmed` | Order paid | `sofe://learn` |
| `reply`, `like`, `follow` | v1.5 | post or profile link |
| `announcement` | Admin push | admin-defined |

Users control types and reminder time in PF13. Pushes go through Expo; invalid tokens are removed.

### F12. Account, privacy and deletion
1. PF11 to PF18.
2. Delete (PF18): warning with what is deleted, re-authenticate, confirm; API soft-deletes immediately, anonymises PII, revokes sessions and schedules hard deletion after 30 days. Purchases and invoices are retained as required by tax law with personal details minimised.
3. Both app stores require in-app account deletion.

## Part B. Admin flows

### A1. Publish a course
1. CS1 New course, CS2 details (title, slug, thumbnail, category, tags, level, instructor, description).
2. CS3 add modules and lessons; CS4 each lesson; CS5 upload videos and wait for `ready`.
3. CS6 price, IAP product id, free preview lessons, points redeem eligibility.
4. Publish checklist runs: title, thumbnail, at least 1 module and 3 lessons, all videos ready, price set, instructor set. Failures are listed.
5. Status Draft, Review, Published (or Scheduled). A content version is saved; the audit log records it.

### A2. Publish an article
CS14: write in the editor, cover, topic, author, SEO; read time auto-calculated; Preview; Publish or Schedule; Featured flag moves it to the top of For You.

### A3. Run daily practice
CS18 write questions (or CS19 import CSV), build a quiz, set points; CS22 assign quizzes and activities to dates; the app builds Today's Practice from the schedule.

### A4. Handle a refund
BC2 find order, BC3 detail, Refund (full or partial) with reason. Server calls Razorpay refund (web) or flags for store refund (in-app), reverses enrollment when full, adds a refund record and updates revenue. Store refunds that happen outside the app arrive via the RevenueCat webhook.

### A5. Work a lead
Lead arrives (Framer form, in-app enquiry, import) as New in BC9. Assign, add a follow-up task, move stages. Won links an order or user; Lost requires a reason. Changes sync to Zoho Bigin.

### A6. Moderate a report (v1.5)
CU4 queue, CU5 open the report with content and history, choose Dismiss, Remove content, Warn, or Suspend; reporter and author are notified; action is audit logged.

### A7. Send a push
CS29: title, message, deep link, segment (all, inactive 7 days, course buyers, topic followers), send now or schedule; stats appear after delivery.

## Part C. State machines

**Course status:** `draft` to `review` to `published` to `archived`. `published` can go back to `draft` only if it has no enrollments. `scheduled` is `review` with a `scheduledAt` that flips to `published` by a job.

**Article status:** `draft`, `review`, `scheduled`, `published`, `archived`.

**Order status:** `created` to `pending` to `paid`; `pending` to `failed`; `paid` to `partially_refunded` or `refunded`; `created` to `cancelled`. Only `paid` creates enrollments.

**Enrollment status:** `active` to `completed`; `active` or `completed` to `revoked` (refund or admin).

**Lesson progress:** `not_started` to `in_progress` to `completed`.

**Video asset (Mux):** `uploading` to `processing` to `ready` or `errored`.

**Report status:** `open` to `dismissed` or `actioned`.

**Lead stage:** `new` to `contacted` to `demo` to `negotiation` to `won` or `lost`.

**User status:** `active`, `suspended`, `deleted`.

**Refund status:** `requested`, `processed`, `failed`.
