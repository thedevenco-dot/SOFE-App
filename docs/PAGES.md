# SOFE Page Inventory

88 mobile screens and 68 admin pages. Use the ID as the task name (for example "build LN4").

**Wave:** app pages are `v1` (launch) or `v1.5`. Admin pages are `Launch` or `Later`.
**Routes:** mobile routes use Expo Router file paths. Admin routes are Next.js App Router paths.
**API:** the main API groups the page uses (see `API.md`).

Every page must implement: loading, empty, error and offline states (see `DESIGN.md`).

## Part A. Mobile app (Expo)

Bottom tabs: Home, Learn, Practise, Startup World, Network, Profile. Network is hidden while `networkEnabled` is false (v1).

### A1. Onboarding and auth (8)

| ID | Page | Route | Wave | API |
|---|---|---|---|---|
| ON1 | Splash | `/` (redirect logic) | v1 | auth/me |
| ON2 | Welcome carousel | `/(auth)/welcome` | v1 | none |
| ON3 | Sign in or sign up | `/(auth)/sign-in` | v1 | auth |
| ON4 | OTP verification | `/(auth)/otp` | v1 | auth |
| ON5 | Profile setup | `/(onboarding)/profile` | v1 | me |
| ON6 | Goals and interests | `/(onboarding)/goals` | v1 | me, topics |
| ON7 | Personalise | `/(onboarding)/personalise` | v1 | me, quotes, vision |
| ON8 | Permissions and first plan | `/(onboarding)/permissions` | v1 | me/push-token |

### A2. Home (7)

| ID | Page | Route | Wave | API |
|---|---|---|---|---|
| HM1 | Home dashboard | `/(tabs)/home` | v1 | home, plan, courses/continue |
| HM2 | Edit quote | `/home/quote` (sheet) | v1 | quotes, me |
| HM3 | Edit manifestation word | `/home/word` (sheet) | v1 | words, me |
| HM4 | Vision board | `/home/vision` | v1 | vision |
| HM5 | Add or edit vision item | `/home/vision/edit` (sheet) | v1 | vision, uploads |
| HM6 | Today's plan manager | `/home/plan` | v1 | plan |
| HM7 | Notification centre | `/notifications` | v1 | notifications |

### A3. Learn (19)

| ID | Page | Route | Wave | API |
|---|---|---|---|---|
| LN1 | Learn home (My Courses tab) | `/(tabs)/learn` | v1 | enrollments, courses/continue, courses/recommended |
| LN2 | All courses | `/learn/courses` | v1 | courses |
| LN3 | Filters and sort | `/learn/filters` (sheet) | v1 | courses/categories |
| LN4 | Course detail | `/learn/course/[slug]` | v1 | courses/:slug |
| LN5 | Checkout | `/learn/checkout/[courseId]` | v1 | orders, coupons |
| LN6 | Purchase success | `/learn/purchase-success` | v1 | orders/:id |
| LN7 | Course curriculum (enrolled) | `/learn/course/[slug]/curriculum` | v1 | courses/:id/curriculum |
| LN8 | Lesson player (video) | `/learn/lesson/[lessonId]` | v1 | lessons, progress, playback |
| LN9 | Lesson reading | `/learn/lesson/[lessonId]` (reading variant) | v1 | lessons, progress |
| LN10 | Lesson quiz | `/learn/lesson/[lessonId]` (quiz variant) | v1 | lessons, quizzes |
| LN11 | Course resources | `/learn/course/[slug]/resources` | v1 | courses/:id/resources |
| LN12 | Course completion | `/learn/course/[slug]/complete` | v1 | enrollments, certificates |
| LN13 | Reviews and write review | `/learn/course/[slug]/reviews` | v1.5 | reviews |
| LN14 | Books list | `/learn/books` | v1 | books |
| LN15 | Book detail | `/learn/book/[slug]` | v1 | books/:slug |
| LN16 | Videos list | `/learn/videos` | v1 | videos |
| LN17 | Video player | `/learn/video/[slug]` | v1 | videos/:slug, playback |
| LN18 | Recommended, see all | `/learn/recommended` | v1 | courses/recommended |
| LN19 | Learn search | `/learn/search` | v1 | search |

### A4. Practise (16)

| ID | Page | Route | Wave | API |
|---|---|---|---|---|
| PR1 | Practise home | `/(tabs)/practise` | v1 | practise/today, streak, points |
| PR2 | Daily practice list | `/practise/daily` | v1 | practise/today |
| PR3 | Quiz play | `/practise/quiz/[id]` | v1 | quizzes, attempts |
| PR4 | Quiz result | `/practise/quiz/[id]/result` | v1 | attempts |
| PR5 | Brain games hub | `/practise/games` | v1.5 | games |
| PR6 | Brain game play | `/practise/games/[id]` | v1.5 | games, attempts |
| PR7 | Game result | `/practise/games/[id]/result` | v1.5 | attempts |
| PR8 | Challenges hub | `/practise/challenges` | v1.5 | challenges |
| PR9 | Scenario challenge play | `/practise/challenges/[id]` | v1.5 | challenges, attempts |
| PR10 | Challenge result | `/practise/challenges/[id]/result` | v1.5 | attempts |
| PR11 | Match the Concept play | `/practise/match/[id]` | v1.5 | games, attempts |
| PR12 | Daily reflection | `/practise/reflection` | v1 | reflections |
| PR13 | Streak history | `/practise/streak` | v1 | streak |
| PR14 | Points history | `/practise/points` | v1 | points |
| PR15 | Rewards | `/practise/rewards` | v1 | rewards |
| PR16 | Redeem confirmation | `/practise/rewards/confirm` | v1 | rewards/redeem |

### A5. Startup World (8)

| ID | Page | Route | Wave | API |
|---|---|---|---|---|
| SW1 | Feed (For You) | `/(tabs)/startup-world` | v1 | articles/feed |
| SW2 | Topic feed | `/startup-world/topic/[slug]` | v1 | articles |
| SW3 | Article reader | `/startup-world/article/[slug]` | v1 | articles/:slug, bookmarks |
| SW4 | Author profile | `/startup-world/author/[id]` | v1 | authors |
| SW5 | Saved articles | `/startup-world/saved` | v1 | bookmarks |
| SW6 | Search | `/startup-world/search` | v1 | search |
| SW7 | Manage topics | `/startup-world/topics` | v1 | topics, topic follows |
| SW8 | Article comments | `/startup-world/article/[slug]/comments` | v1.5 | comments |

### A6. Network (12, all v1.5)

| ID | Page | Route | API |
|---|---|---|---|
| NW1 | Network feed (For You) | `/(tabs)/network` | posts/feed |
| NW2 | People | `/network/people` | users/suggested |
| NW3 | My Network | `/network/mine` | follows |
| NW4 | Connection requests | `/network/requests` | follows (reserved) |
| NW5 | Compose post | `/network/compose/post` | posts, uploads |
| NW6 | Compose article | `/network/compose/article` | posts |
| NW7 | Share project | `/network/compose/project` | posts, projects |
| NW8 | Create poll | `/network/compose/poll` | posts |
| NW9 | Post detail | `/network/post/[id]` | posts/:id, comments |
| NW10 | Other user's profile | `/network/user/[id]` | users/:id, follows |
| NW11 | Network search | `/network/search` | search |
| NW12 | Report and block | `/network/report` (sheet) | reports, blocks |

### A7. Profile and settings (18)

| ID | Page | Route | Wave | API |
|---|---|---|---|---|
| PF1 | My profile: Progress | `/(tabs)/profile` | v1 | me/stats |
| PF2 | My profile: Portfolio | `/(tabs)/profile?tab=portfolio` | v1 | projects |
| PF3 | My profile: Achievements | `/(tabs)/profile?tab=achievements` | v1 | achievements |
| PF4 | Edit profile | `/profile/edit` | v1 | me, uploads |
| PF5 | Learning stats detail | `/profile/stats` | v1 | me/stats |
| PF6 | Achievement detail | `/profile/achievement/[id]` | v1 | achievements |
| PF7 | Projects list | `/profile/projects` | v1 | projects |
| PF8 | Add or edit project | `/profile/projects/edit` | v1 | projects, uploads |
| PF9 | Project detail | `/profile/projects/[id]` | v1 | projects |
| PF10 | Followers and following | `/profile/connections` | v1.5 | follows |
| PF11 | Settings home | `/settings` | v1 | none |
| PF12 | Account and security | `/settings/account` | v1 | me, auth |
| PF13 | Notification settings | `/settings/notifications` | v1 | me/settings |
| PF14 | Privacy and blocked users | `/settings/privacy` | v1 | me/settings, blocks |
| PF15 | Purchases and invoices | `/settings/purchases` | v1 | orders, invoices |
| PF16 | Help and support | `/settings/help` | v1 | support |
| PF17 | Legal | `/settings/legal` | v1 | legal |
| PF18 | Delete account | `/settings/delete` | v1 | me/delete |

Totals: 88 screens. v1 = 66, v1.5 = 22.

## Part B. Admin web app (Next.js)

### B1. Common (4)

| ID | Page | Route | Wave |
|---|---|---|---|
| AD1 | Login and 2FA | `/login` | Launch |
| AD2 | Dashboard (role-aware) | `/dashboard` | Launch |
| AD3 | Global search | `/search` | Launch |
| AD4 | My admin profile | `/me` | Launch |

### B2. Content Studio (31)

| ID | Page | Route | Wave |
|---|---|---|---|
| CS1 | Courses list | `/content/courses` | Launch |
| CS2 | Course editor: details | `/content/courses/[id]` | Launch |
| CS3 | Curriculum builder | `/content/courses/[id]/curriculum` | Launch |
| CS4 | Lesson editor | `/content/courses/[id]/lessons/[lessonId]` | Launch |
| CS5 | Video upload and status | `/content/media/video` | Launch |
| CS6 | Pricing and access | `/content/courses/[id]/pricing` | Launch |
| CS7 | Course reviews | `/content/courses/[id]/reviews` | Later |
| CS8 | Categories and tags | `/content/categories` | Launch |
| CS9 | Instructors | `/content/instructors` | Launch |
| CS10 | Books library | `/content/books` | Launch |
| CS11 | Book editor | `/content/books/[id]` | Launch |
| CS12 | Videos library | `/content/videos` | Launch |
| CS13 | Articles list | `/content/articles` | Launch |
| CS14 | Article editor | `/content/articles/[id]` | Launch |
| CS15 | Topics and categories | `/content/topics` | Launch |
| CS16 | Authors | `/content/authors` | Launch |
| CS17 | Quizzes list | `/practise/quizzes` | Launch |
| CS18 | Quiz and question bank editor | `/practise/quizzes/[id]` | Launch |
| CS19 | CSV import | `/practise/import` | Launch |
| CS20 | Brain games manager | `/practise/games` | Later |
| CS21 | Scenario challenges editor | `/practise/challenges` | Later |
| CS22 | Daily practice scheduler | `/practise/schedule` | Launch |
| CS23 | Points and rules | `/practise/points` | Launch |
| CS24 | Rewards catalogue | `/practise/rewards` | Launch |
| CS25 | Achievements and badges | `/practise/achievements` | Later |
| CS26 | Quotes and prompts library | `/content/quotes` | Launch |
| CS27 | Home curation | `/content/curation` | Launch |
| CS28 | Banners and announcements | `/content/banners` | Later |
| CS29 | Push composer | `/content/push` | Launch |
| CS30 | Notification templates | `/content/templates` | Later |
| CS31 | Content version history | `/content/versions` | Later |

### B3. Community and Users (11)

| ID | Page | Route | Wave |
|---|---|---|---|
| CU1 | Users list | `/community/users` | Launch |
| CU2 | User detail | `/community/users/[id]` | Launch |
| CU3 | Verification and badges | `/community/verification` | Later |
| CU4 | Reports queue | `/community/reports` | Later |
| CU5 | Report detail and action | `/community/reports/[id]` | Later |
| CU6 | Posts and comments browser | `/community/posts` | Later |
| CU7 | Moderation rules | `/community/rules` | Later |
| CU8 | Suspended and banned users | `/community/suspended` | Later |
| CU9 | SOFE Official publisher | `/community/official` | Later |
| CU10 | Support inbox | `/community/support` | Launch |
| CU11 | Community analytics | `/community/analytics` | Later |

### B4. Business Console (16)

| ID | Page | Route | Wave |
|---|---|---|---|
| BC1 | Revenue dashboard | `/business/revenue` | Launch |
| BC2 | Orders list | `/business/orders` | Launch |
| BC3 | Order detail | `/business/orders/[id]` | Launch |
| BC4 | Refunds and failed payments | `/business/refunds` | Launch |
| BC5 | Reconciliation | `/business/reconciliation` | Later |
| BC6 | Subscriptions | `/business/subscriptions` | Later |
| BC7 | Coupons | `/business/coupons` | Launch |
| BC8 | Invoices and GST | `/business/invoices` | Launch |
| BC9 | Leads pipeline | `/business/leads` | Launch |
| BC10 | Lead detail | `/business/leads/[id]` | Launch |
| BC11 | Lead sources and UTM | `/business/sources` | Later |
| BC12 | Campaigns | `/business/campaigns` | Later |
| BC13 | Expenses | `/business/expenses` | Later |
| BC14 | Payouts | `/business/payouts` | Later |
| BC15 | Funnel and retention | `/business/funnel` | Launch |
| BC16 | Reports and exports | `/business/reports` | Launch |

### B5. Platform (6)

| ID | Page | Route | Wave |
|---|---|---|---|
| PL1 | Admin users | `/platform/admins` | Launch |
| PL2 | Roles and permissions | `/platform/roles` | Launch |
| PL3 | Audit log | `/platform/audit` | Launch |
| PL4 | App config and feature flags | `/platform/config` | Launch |
| PL5 | Integrations status | `/platform/integrations` | Later |
| PL6 | Legal documents | `/platform/legal` | Launch |

Totals: 68 admin pages. Launch = 46, Later = 22.

## Part C. Non-page surfaces

Not counted as pages, but must be built:
- Push notification templates and deep link map (see `FLOWS.md` F11).
- Transactional emails: welcome, receipt, refund, password reset (admin), weekly digest (later).
- Share sheets and deep links: `sofe://course/{slug}`, `sofe://article/{slug}`, `sofe://profile/{id}`, plus universal links on the marketing domain.
- Force-update and maintenance screen (driven by `appConfig`).
- Offline banner and cached states.
