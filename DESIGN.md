# SOFE Design System

Tokens live in `packages/shared/src/theme.ts`. This file explains how to use them. Brand: shield crest with an origami hummingbird, navy, cream and orange, "Learn - Create - Lead".

## 1. Colour

| Token | Hex | Use |
|---|---|---|
| navy | #061E30 | Main background (dark theme), text on light |
| slate | #142D42 | Tab bar, borders, secondary surfaces on dark |
| cream | #FFF5E9 | Light screens, course cards, search bar |
| orange | #FF8429 | Primary buttons, active tab, progress fill, highlights, icons on dark |
| gold | #D99045 | Premium details, badges, logo accents |
| white | #FFFFFF | Headings and icons on dark, cards on cream |
| orangeDeep | #B84A00 | Orange text and icons on cream or white (added for contrast) |
| line | #E6D9C6 | Borders on cream |
| mutedOnDark | #A9B8C6 | Secondary text on navy and slate |
| mutedOnLight | #5B6B7A | Secondary text on cream |

The "Additional colours" part of the palette was not available. Status colours in `theme.ts` (success, error, warning, info) are placeholders. Replace them when the palette is final.

### Themes
- **Dark theme:** Home, Learn, Practise, Profile (navy background, slate cards, white text).
- **Light theme:** Startup World, Network, forms and sheets in light areas (cream background, white cards, navy text).
- A screen picks its theme from a route-level setting. Components read colours from the theme, never from fixed values.

### Contrast (calculated by hand, verify before release)

| Pair | Ratio | Verdict |
|---|---|---|
| Navy text on orange | about 7.0 | Pass: use for primary button text |
| White text on orange | about 2.4 | **Fail**: do not use |
| Orange on navy (text, icons) | about 7.0 | Pass |
| Gold on navy | about 6.5 | Pass |
| Navy on cream | about 15.8 | Pass |
| Orange on cream (text) | about 2.3 | **Fail**: use orangeDeep |
| orangeDeep on cream | about 4.9 | Pass |
| White on orangeDeep | about 5.2 | Pass |
| mutedOnDark on slate | about 7.0 | Pass |
| mutedOnLight on cream | about 5.1 | Pass |

Rules: primary button = orange fill, navy text, bold. On cream or white, orange text (for example the "Start" label, active tab text in light areas, "View all") becomes orangeDeep. Gold is not used for text on light backgrounds.

## 2. Typography

Proposed (confirm with Figma): **Playfair Display** for screen titles and hero text (matches the serif crest wordmark), **Inter** for all UI text and numbers. The logo wordmark is an image, not live text.

| Style | Size / line | Font | Use |
|---|---|---|---|
| display | 32 / 38 | Playfair 700 | Hero greeting name |
| title1 | 26 / 32 | Playfair 700 | Screen titles (Learn, Practise) |
| title2 | 22 / 28 | Playfair 700 | Section headers, article titles |
| title3 | 18 / 24 | Inter 600 | Card titles |
| body | 15 / 22 | Inter 400 | Paragraphs |
| bodyStrong | 15 / 22 | Inter 600 | Emphasis |
| caption | 13 / 18 | Inter 400 | Meta text (read time, lessons) |
| micro | 11 / 14 | Inter 500 | Tab labels, tags |

Support dynamic type up to 130% without clipping. Article reader supports user text size (S, M, L).

## 3. Spacing, shape, elevation

- 4 pt grid: 4, 8, 12, 16, 24, 32, 48. Screen side padding 16.
- Radius: 8 (chips, small), 12 (inputs, buttons), 16 (cards), 24 (sheets), pill (tags, progress).
- Elevation: dark theme uses lighter surfaces instead of shadows; light theme uses a soft shadow (y 2, blur 8, 8% navy).
- Icons: lucide, 24 px, 1.75 stroke. Active tab icon filled orange.

## 4. Components (build these first)

| Component | Spec |
|---|---|
| Button | Variants: primary (orange, navy text), secondary (outline, text colour), ghost, destructive. Sizes: lg 52, md 44, sm 36 height. Loading and disabled states. Pill optional for small "Start" buttons. |
| Card | Surface colour, radius 16, padding 12-16, optional pressed state. |
| CourseCard | Thumbnail (16:9 or square 88), title, lessons and duration, progress bar, percent. |
| ProgressBar | Pill, orange fill on slate (dark) or line (light), height 6. |
| ProgressRing | Orange arc with percent in the centre (Profile). |
| TabBar (bottom) | Slate background, 6 items, active orange with filled icon, label micro. Hidden on deep screens. |
| TopTabs | Text tabs with orange underline for active (orangeDeep text on light). |
| Chip / Tag | Pill, topic colour with caption text (for example IDEA & VALIDATION). |
| PointsChip | Flame icon with points (Practise header). |
| StreakTracker | 7 circles Mon-Sun, filled orange with check when done. |
| ListRow | Leading icon or image, title, subtitle, trailing action (Start button, chevron, bookmark). |
| ArticleCard | Image, title, read time, bookmark; hero variant with large image. |
| PostCard (v1.5) | Avatar, name, headline, degree label optional, time, body, media, actions row. |
| Avatar | Sizes 24, 32, 44, 96; initials fallback; verified badge overlay. |
| Input / SearchBar | Cream or surface fill, radius 12, clear button, error state. |
| BottomSheet | Radius 24 top, handle, used for filters, edit quote, report. |
| Modal / Dialog | Centre, two actions, destructive style for delete. |
| Toast | Top, auto-dismiss 3 s, success or error. |
| Skeleton | Shimmer blocks matching each card; no spinner-only screens. |
| EmptyState | Illustration or icon, one line, one button. |
| ErrorState | Message and Retry button. |
| Badge (achievement) | Circular medal, gold or orange, locked variant in grey. |
| PlanChecklist | Row with check circle, label, completes with animation (Home). |
| Banner | Announcement strip with CTA and dismiss. |

Admin (web) uses shadcn/ui components themed with the same tokens: DataTable (sort, filter, pagination), FormField, RichTextEditor (Tiptap), Kanban (leads), StatCard, Badge for status, ConfirmDialog.

## 5. Screen patterns

- **Header:** large serif title left, search and action icons right. Home header has logo, bell, avatar.
- **Section:** title (title3) with optional "View all" link (accent text).
- **Lists:** cards separated by 12; cursor-paginated infinite scroll.
- **Primary action:** one primary button per screen, near the bottom for forms, inline for cards.
- **Deep screens** (lesson player, quiz play, article reader): full screen with back button, no tab bar.
- **Safe areas:** respect notches and the home indicator.

## 6. States every screen needs

Loading (skeleton), empty, error with retry, offline banner, and "locked or paid" (shows price and Buy button).

## 7. Motion

150 ms for taps and toggles, 250 ms for screen and sheet transitions, 400 ms for celebrations (streak, completion). Use Reanimated. Respect reduced motion by switching animations to fades. Haptic feedback on task completion and points earned.

## 8. Accessibility checklist

- All text meets WCAG AA contrast (see table).
- Touch targets 44x44 pt minimum.
- Every icon button has an accessibility label; images have alt text or are marked decorative.
- Never use colour alone to show state (streak done also shows a check).
- Screen reader order matches visual order; focus returns to a sensible place after sheets close.
- Test with VoiceOver and TalkBack, and with the largest system font size.

## 9. Brand and logo usage

- Full logo (crest, wordmark and ribbon) on splash and web header only.
- Header uses shield plus "SOFE". App icon uses a simplified shield or the hummingbird alone on solid navy, 1024x1024, no transparency for iOS; provide an Android adaptive icon (safe zone 66%).
- Keep clear space equal to the crest's width/4 around the logo. Do not recolour, stretch or add effects.
- Needed files: logo SVG master, app icon, adaptive icon, splash, favicon, Play Store feature graphic, store screenshots.
- Imagery: warm, realistic founder and workspace photography; avoid stock clichés. Vision board images are user-provided.
