# SOFE Design V2 (source of truth for look and feel)

Reference screens: `docs/design/home.png`, `learn.png`, `blog.png`, `practise.png`, `network.png`, `profile.png`.
This file replaces the visual parts of `DESIGN.md`. Tokens live in `packages/shared/src/theme.ts`. Logic, data and permissions are unchanged.

> **Status:** written by reading the six screens by eye. Measurements (sizes, radii, spacing) are estimates. Check them against the Figma file and correct the numbers here before building. Where this file and an image disagree, ask before choosing.

## 0. Decisions to confirm before building

Edit the "Default" column where you disagree. The agent must follow this table.

| # | Question | Default used in this file |
|---|---|---|
| D1 | Tab bar | v1 tabs: Home, Learn, Blog, Practise, Profile. Network tab added in v1.5 (flag `networkEnabled`). The Blog screen shows 6 tabs; the other screens show 5 without Blog, so this must be confirmed |
| D2 | Name of Startup World | "Blog" in navigation, page title "SOFE Blog" |
| D3 | Reward currency | **Points** everywhere (the Home mockup says "XP"; change copy to "pts") |
| D4 | Cohorts and fellowship ("Cohort IX Week 4", "Cohort 14", "Free for Fellows", "Fellowship '25") | Treated as **optional label fields**, hidden unless the user has a cohort. Not a v1 feature. The profile reads "SAFE Fellowship"; likely a typo for SOFE |
| D5 | Home vision board and manifestation word | Removed from Home (the Curator's Manifesto card replaces them). Move to Profile later, or drop |
| D6 | Daily plan | 3 tasks ("Daily Protocol"), not 5 |
| D7 | Practise scope | v1: Case Simulation (daily featured), Rapid Calibration quiz, Specialized Disciplines list, 7-Day Consistency. Brain games and point redemption are not shown, so deferred |
| D8 | Learn tabs | Books and Videos are not in the design. Deferred; courses only in v1 |
| D9 | Profile | No followers/following counts in v1. "Share CV" button is shown disabled or hidden until built |
| D10 | Network | Still v1.5. Design is kept for reference |

## 1. Principles

- **Two surfaces:** a **navy** header zone and a **cream** content sheet with large rounded top corners that overlaps the header. Content lives on **white cards** on cream.
- **Serif for voice, sans for work:** headings and card titles in a serif; everything else in a clean sans.
- **One loud colour:** orange is for the primary action, active state and small labels. Everything else is navy, cream, white and muted.
- **Editorial, not playful:** small uppercase eyebrow labels, generous spacing, large images with dark gradient overlays.
- Every screen composes shared components and tokens only. No raw hex, font sizes or spacing in screens.

## 2. Colour tokens

Palette (unchanged): navy `#061E30`, slate `#142D42`, cream `#FFF5E9`, orange `#FF8429`, gold `#D99045`, white `#FFFFFF`.

| Role token | Value | Use |
|---|---|---|
| `bg.dark` | navy | Header zone, tab bar, dark cards |
| `bg.darkRaised` | slate | Chips and inner panels on dark |
| `bg.sheet` | cream | Main content sheet |
| `bg.card` | white | Cards on cream |
| `bg.tint` | peach tint of cream (about `#FFF0E0`, confirm in Figma) | Meta chips, inner tiles, discipline icon tiles |
| `border.subtle` | `#E6D9C6` | Card borders, dividers on cream |
| `track` | beige (about `#EADFD0`, confirm) | Progress bar track on light |
| `text.onDark` | white | Titles on navy |
| `text.mutedOnDark` | `#A9B8C6` | Secondary text on navy |
| `text.primary` | navy | Titles and body on light |
| `text.muted` | `#5B6B7A` | Secondary text on light |
| `accent.fill` | orange | Buttons, progress fill, active tab, flame, icons |
| `accent.text` | **orangeDeep `#B84A00`** | Orange **text** on cream or white (eyebrows, links, "Analyze") |
| `accent.onDarkText` | orange | Orange text on navy (passes, about 7:1) |
| `premium` | gold | Verified, premium details |
| `success` / `error` | placeholders in `theme.ts` | Until the extra palette is final |

**Contrast rules (calculated by hand, verify):** navy text on orange fill about 7:1 (use for buttons). White text on orange about 2.4:1 (never). Bright orange text on cream about 2.3:1 (never; use `accent.text`). Muted text colours pass AA on their surfaces.

## 3. Typography

Fonts: confirm exact families in Figma. Defaults: serif **Playfair Display** (headings) and **Inter** (UI), loaded with expo-font.

| Style token | Size / line | Font | Examples |
|---|---|---|---|
| `display` | 28 / 34 | Serif bold | "Good morning, Alex.", "Master Execution", "Practise" |
| `title1` | 24 / 30 | Serif bold | Card hero titles ("Build something that matters.") |
| `title2` | 20 / 26 | Serif bold | Section titles ("Active Curriculum", "Your Daily Protocol") |
| `title3` | 17 / 23 | Serif semibold | Course titles in cards, post titles |
| `body` | 14 / 20 | Sans regular | Descriptions |
| `bodyStrong` | 14 / 20 | Sans semibold | Row titles |
| `caption` | 12 / 16 | Sans regular | Meta text, durations |
| `eyebrow` | 10-11 / 14, uppercase, tracking about 0.08em | Sans semibold | "IN PROGRESS", "MODULE 02 · TRACTION" |
| `numeric` | 28-32 / 34 | Serif bold | Stat tile numbers ("48.5") |
| `button` | 15 / 20 | Sans bold | Buttons |
| `tab` | 10 / 12, uppercase | Sans semibold | Tab bar labels |

Support dynamic type up to 130%. Truncate with ellipsis where the designs do (one or two lines in cards).

## 4. Spacing, shape, elevation

- 4 pt grid. Screen side padding 16. Gap between cards 12-16. Section gap 24-28.
- Radius: chips 999, buttons 12-14, small tiles 10-12, cards 16-20, content sheet top corners 28, images 14-16.
- Cards: white, 1px `border.subtle`, soft shadow (y 2, blur 10, 6-8% navy). Dark cards: navy or navy gradient, no border.
- Content sheet: cream, top radius 28, overlaps the header by about 24, with a small drag-handle bar centred at the join on Home.
- Icons: lucide, 20-24, stroke 1.75. Active tab icon filled orange.
- Motion: 150 / 250 / 400 ms; reduced-motion fallback to fades; haptics on task completion.

## 5. Component catalogue (build in this order, add each to the gallery)

### Structure
- **AppHeader**: navy; left: logo tile (orange rounded square with serif "S", 28 px) + serif "SOFE" wordmark (+ optional section name, for example "SOFE · PRACTISE"); right: bell (orange dot when unread) and avatar (circle, orange ring or initials). Variants: Home (with greeting block below), Title (screen title and subtitle below), Blog (adds a search icon). *Until `logo-monogram.svg` exists, build the tile from tokens (orange rounded square with serif S) as a temporary component.*
- **ScreenHero**: navy zone below the header with eyebrow row (eyebrow label left, optional StreakChip right), display title and a muted one-line subtitle.
- **ContentSheet**: cream container with rounded top corners, overlaps hero.
- **TabBar**: navy, labels uppercase 10, active orange filled icon, inactive `text.mutedOnDark`. Hidden on deep screens.
- **SectionHeader**: serif `title2` left; right-aligned eyebrow-style link in `accent.text` ("VIEW ALL 32", "BROWSE LIBRARY →", "IN PROGRESS"). Variant with an orange vertical bar before the title (Tactical Briefings).
- **EyebrowLabel**: uppercase small label, colour from props (`accent.text` on light, orange on dark).

### Actions
- **Button**: variants `primary` (orange fill, navy bold text, optional trailing arrow or play icon, full width, height 50), `secondary` (cream/white fill, 1px border, navy text, optional leading icon), `dark` (navy fill, white text, pill: "Begin Quiz"), `ghost`/`link` (orange deep text with arrow, "Analyze →"), `icon` (square 36-40, cream fill, bookmark/share). States: pressed, loading, disabled.
- **FollowButton**: pill; default outlined/cream "+ Follow", active orange fill "✓ Following".

### Chips and tags
- **FilterChip**: pill; selected = navy fill + white text, unselected = white fill + border + navy text. Horizontal scroll row.
- **TagChip**: small label on an image or inline: orange fill with white or navy text (check contrast, prefer navy on orange), or translucent navy with white text. Examples: "FOUNDER ESSENTIALS", "Marketing", "Teardown".
- **MetaChip**: icon + text in a `bg.tint` rounded tile ("Intermediate", "8.5 Hours", "24 Lessons", "6 mins read", "+50 Points").
- **StreakChip**: dark pill with flame ("Day 26 Streak"); larger variant with points ("7D Streak +340 pts").
- **TimeChip**: translucent dark pill on image with clock ("18 mins left").

### Progress
- **ProgressBar**: height 6, pill, orange fill on `track`; optional right label (percent) and left label.
- **ProgressRing**: small ring with "2/3" in the centre.
- **WeeklyConsistency**: row of 7 circles (M T W T F S S), done = orange with check, today = ring; below it a progress bar with "38m / 45 mins (84%)".
- **StatTile**: white card; eyebrow label top-left with orange icon top-right; large serif number with optional small orange unit ("7 Days"); muted caption. 2x2 grid.

### Cards
- **Card**: variants `white`, `dark`, `tint`, `outlined-orange`.
- **HeroImageCard**: full-bleed image, dark gradient bottom, eyebrow, serif title, body, optional quote box.
- **CourseCardLarge** (Flagship / Active Curriculum): image with TagChip and TimeChip or bookmark button; eyebrow; serif title; description; MetaChip row; instructor row (AvatarStack, name, rating); primary Button.
- **CourseCardRow**: 64-72 px thumbnail left; label, title, meta; trailing bookmark or percent.
- **CourseCardGrid**: two-column compact: image with tag, meta line, title, instructor, rating.
- **CarouselCard**: width about 75% of screen, image, eyebrow category and duration, serif title, one-line description; horizontal scroll with peek.
- **TaskRow** (Daily Protocol): card with check circle (done = orange check and strikethrough title and "+25 pts" right; pending = outlined circle, title, minutes right, subtitle below).
- **DisciplineRow**: icon tile (`bg.tint`, orange icon), title, truncated subtitle, trailing percent pill and chevron; "New" pill variant.
- **FeaturedChallengeCard** (Practise): image top with TagChips, serif question title, description, 2x2 MetaChip grid, primary Button "Start Challenge".
- **QuickQuizCard**: eyebrow with icon, serif title, description, meta row (scenarios, minutes, points) and dark pill Button.
- **BadgeRow**: `bg.tint` panel with circular navy icon, bold title, muted description.
- **VentureCard**: dark image card with TagChip, serif title, description, tag pills and an open-link icon.
- **MilestoneCard**: dark card with eyebrow, serif quote-style goal, target text, ProgressBar and "65% Completed" in orange.
- **PostCard** (Network, v1.5): avatar with verified tick, name, role · time, optional type TagChip, serif title, body, media, optional metric strip, action row (like, comment, repost, bookmark counts). Types: Essay, Teardown, Showcase.
- **RoundRobinCard**: orange 1px outline on cream, eyebrow with icon, serif question, AvatarStack, "+21 responses", link "Join thread →".
- **TrendingRow**: "#1" rank, title, "54 replies · detail", chevron.
- **QuoteCard**: tinted card with serif italic quote and author row (+ "Cite" action).
- **NewsletterCard**: dark card, eyebrow, serif headline, body, email input, orange full-width button.
- **SearchBar**: white with border, search icon, placeholder, paired with an icon button for filters.
- **Avatar**: sizes 24 / 32 / 44 / 96; orange ring variant; verified badge (small navy circle with check) bottom-right; initials fallback. **AvatarStack** with "+N".
- **QuoteBox** (inside hero card): bordered panel with serif italic quote and right-aligned author.

### Utility
Skeletons that match each card, EmptyState, ErrorState with Retry, Toast, BottomSheet, Dialog, offline banner.

## 6. Screen blueprints

Sections top to bottom. Each section names the components used. Page IDs refer to `PAGES.md`.

### Home (HM1)
1. AppHeader (Home), ScreenHero: eyebrow "COHORT IX · WEEK 4" (hidden if no cohort) + StreakChip "Day 26 Streak"; display "Good morning, {name}."; subtitle (for example today's focus and next scheduled session).
2. ContentSheet with drag handle.
3. HeroImageCard "Curator's Manifesto": eyebrow, title "Build something that matters.", body, QuoteBox (quote and author).
4. SectionHeader "Active Curriculum" + "IN PROGRESS" > CourseCardLarge variant: image, TagChip, TimeChip "18 mins left", eyebrow "MODULE 02 · TRACTION", serif course title, lesson line, instructor row, ProgressBar "Curriculum Progress 68%", primary Button "Continue learning →".
5. SectionHeader "Your Daily Protocol" + ProgressRing "2/3", subtitle "Daily discipline scales ventures" > 3 TaskRow.
6. SectionHeader "Recommended for You" + "BROWSE LIBRARY →" > CarouselCard row.
7. SectionHeader "Founder Spotlight" + "CURATED READ" > large article card: image, TagChip "WEEKLY DEEP DIVE", meta (read time, topic), serif title, excerpt, link "Read essay ↗", icon buttons bookmark and share.
8. TabBar (Home active).

### Learn (LN1, LN2, LN4)
1. AppHeader (Title): "Learn" + FilterChip-like cohort chip ("COHORT 14", optional), bell, avatar; subtitle "32 Courses · Term Active" (optional).
2. ContentSheet: display "Master Execution" + subtitle; SearchBar + filter icon button.
3. SectionHeader eyebrow "IN PROGRESS · Last session yesterday" + "Syllabus" > in-progress card: thumbnail with module badge, TimeChip, course title, instructor row, ProgressBar "45% Completed" + lesson name, primary Button "Resume" with play icon.
4. Eyebrow "TRACKS & FOCUS AREAS" + "Swipe horizontal" > FilterChip row (All Masterclasses, Startups & Ideation, Venture...).
5. CourseCardLarge "Flagship Masterclass": image with label and bookmark, orange tag "COHORT RECOMMENDED", serif title, description, MetaChips (level, hours, lessons, "Free for Fellows" when applicable), AvatarStack and "Taught by ..." with rating, primary Button "Enroll in Masterclass →".
6. SectionHeader "Core Disciplines" with eyebrow "CURATED LIBRARY" and "View all 32" > CourseCardLarge (executive track), two CourseCardGrid, a CourseCardRow.
7. QuoteCard "THE SOFE METHODOLOGY": testimonial with author chip ("Class of '23").

### Blog (SW1; previously Startup World)
1. AppHeader (Blog): logo, "SOFE", bell, avatar, StreakChip row (eyebrow "COHORT IX · WEEK 4").
2. Title "Sofe — Blog" and subtitle ("Curated essays, teardowns and tactical dispatches for venture-backed founders").
3. Row: dark chip "ISSUE NO. 48" + "Weekly Curated", search and bookmark icon buttons. FilterChip row (All Dispatches, Venture Strategy...).
4. Lead essay card: image with orange label "THIS WEEK'S LEAD ESSAY", TagChips ("Deep Teardown", "4.9 bookmark score"), title, description, author row (avatar, names, read time · series, bookmark), primary Button "Read Full Dispatch →".
5. SectionHeader (orange bar) "Tactical Briefings" + "3-MIN TELEARDOWNS" > briefing cards: TagChip, read-time, serif title, blurb, byline, link "Analyze →", small chart thumbnail.
6. Series card: eyebrow "CURATED SERIES · MODULE 03", "3 of 5 Completed" pill, title, description, ProgressBar.
7. CourseCardRow-style article rows ("PART IV · OUTBOUND PIPELINE", title, author · minutes, bookmark).
8. QuoteCard with "Cite".
9. NewsletterCard "THE SATURDAY DISPATCH" (needs an email list integration; see decisions).
10. TabBar (Blog active).

### Practise (PR1)
1. AppHeader (Title "SOFE · PRACTISE"); ScreenHero: display "Practise", subtitle "Think sharper. Make better decisions under pressure."; streak chip "7D Streak +340 pts".
2. FeaturedChallengeCard "CASE SIMULATION #42" with TagChip "Seed Round Diligence", question title, description, MetaChips (Angel Diligence, Intermediate, 6 mins read, +50 Points), primary Button "Start Challenge →".
3. Eyebrow "RAPID CALIBRATION" + "Refreshes in 4h" > QuickQuizCard (category "LEGAL & TERM SHEETS", title, description, thumbnail, 5 Scenarios, 4 mins, +25 pts, dark pill "Begin Quiz").
4. SectionHeader "Specialized Disciplines" + "All Modules (5)" > DisciplineRow x5 (percent pills; "New" on a new one).
5. Card "7-Day Consistency": flame icon, title, points total "1,420 pts", tier line ("Tier: Seed Stage Builder"), "Top 8% Founders", WeeklyConsistency, eyebrow "EARNED ACCREDITATIONS" with TagChips.
6. TabBar (Practise active).

### Network (NW1, v1.5)
1. AppHeader (Title "Network"); ScreenHero-like block with eyebrow "THE COLLECTIVE", display "Network", subtitle, search and bell icon buttons.
2. FilterChip row (All Insights, Seed Stage, Customer Discovery).
3. SectionHeader "Founders to know" + "VIEW DIRECTORY" > carousel of person cards (avatar, verified, role @ company, short badge, FollowButton).
4. Divider "FEATURED ESSAY" > PostCard (Essay) with media, counts.
5. PostCard (Teardown) with metric strip; PostCard (Showcase) with "Live Demo" image tag and "Give Feedback" button.
6. RoundRobinCard.
7. Trending Topics card (TrendingRow x3, "Past 24 Hours").
8. Footer note "You're caught up with the founder graph for today."

### Profile (PF1, PF2, PF3)
1. AppHeader (Title "Profile") with share and settings icon buttons; eyebrow row "FOUNDER DOSSIER" left and cohort or fellowship label right (optional).
2. Identity card (white): Avatar 96 with orange ring and verified badge, serif name, orange-deep headline, bio, buttons: secondary "Edit Profile" and primary "Share CV" (hidden or disabled until built, D9).
3. MilestoneCard "FOUNDER MILESTONE" with "Active Sprint" pill.
4. StatTile grid 2x2: Logged (hrs), Curriculum (courses completed), Momentum (day streak), Mastery (achievements).
5. Card "Fellow Badges" + "VERIFIED" label > 3 BadgeRow.
6. VentureCard "Active Venture" + "PROJECT 01".
7. Card "Curriculum & Notes": segmented tabs In-Progress (n) / Completed (n) / Articles (n) > CourseCardRow with progress.
8. TabBar (Profile active).

## 7. Data these designs need (for API and schema work)

Add only what is built. Names are suggestions.
- **Home:** greeting name; optional `cohort { name, week }`; streak days; manifesto card (curated quote + image, admin-managed via Home curation); active curriculum (course, module, lesson, minutes left, percent, instructor); daily protocol (3 tasks, points, minutes); recommended carousel; spotlight article.
- **Learn:** tracks (course categories with a "track" flag), flagship flag, level, hours, lesson count, rating and count, instructor list, "free for fellows" flag, testimonial entries.
- **Practise:** case simulations (scenario challenge with tag, level, minutes, points), rapid calibration quiz (refresh timer), disciplines (category with scenario count and the user's mastery percent), weekly goal (minutes target and done), user tier, percentile rank (nightly job), accreditation badges.
- **Blog:** issue number and "weekly curated" flag, lead essay, briefing type and read time, series with step progress, bookmark score, newsletter subscribers (needs an email list).
- **Profile:** milestone (goal text, target date, percent), hours logged, courses completed, streak, achievements count, badges (verified flag), ventures (projects), curriculum tabs.
- **Network (v1.5):** post types (essay, teardown, showcase), founders directory, topics, round robin threads, trending topics.

## 8. Rules for implementation

1. Update `packages/shared/src/theme.ts` from sections 2 to 4. Both apps import it.
2. Build components in section 5 with all variants and states, and show each in the component gallery.
3. Screens may only compose shared components and tokens. A lint rule fails the build on raw hex colours, raw font sizes or raw spacing numbers outside the theme file and the components folder.
4. A screen with no reference image is built only from the components and conventions in this file and is labelled "extrapolated" in the task summary.
5. Orange text on light surfaces uses `accent.text`. Primary buttons use navy text.
6. Every component and screen has loading, empty, error and offline states.
7. Touch targets 44 pt or more; accessibility labels on icon buttons; support dynamic type and reduced motion.
8. Images use expo-image with a placeholder, and gradient overlays use expo-linear-gradient (ask before adding libraries not already in the project).
