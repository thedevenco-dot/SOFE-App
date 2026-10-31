# SOFE Admin Panel Specification

Next.js (App Router, TypeScript), shadcn/ui themed with `theme.ts`, TanStack Table, react-hook-form + zod, Tiptap. Talks only to the `/admin/*` API. Page IDs match `PAGES.md`. Permissions match `PERMISSIONS.md`.

## 1. Global behaviour

- **Layout:** left sidebar (grouped: Content Studio, Practise, Community, Business, Platform), top bar with global search (AD3), notifications and the user menu. Sidebar items appear only if the role has the permission.
- **Auth:** Firebase email + password, then TOTP 2FA (AD1). Session expires after 8 hours idle.
- **Tables (DataTable):** server-side pagination (cursor), sort, filters, column visibility, CSV export where the permission allows, row actions menu, bulk select where listed.
- **Forms:** validation with the same zod schemas as the API (from `packages/shared`); autosave drafts for long editors; "unsaved changes" prompt; inline field errors.
- **Status badges:** Draft (grey), Review (gold), Scheduled (blue), Published (green), Archived (muted), Failed (red).
- **Destructive actions:** confirm dialog with a reason field for refund, delete, ban, unpublish; written to `auditLogs`.
- **Audit:** every write endpoint logs actor, action, entity, before and after. PL3 shows it.
- **Versions:** courses, lessons and articles save a `contentVersions` snapshot on every publish and on manual save (CS31).
- **Empty, loading, error states** on every page. Toasts for success and errors.
- **Responsive:** designed for desktop (1280+) and usable on tablet. Not required on phones.
- **Accessibility:** keyboard navigable, labelled controls, AA contrast.

## 2. Common

**AD1 Login and 2FA.** Email, password, then 6-digit TOTP. First login forces 2FA setup (QR code, backup codes). Lockout after 5 failures for 15 minutes.
**AD2 Dashboard.** Cards depend on role. Content: published courses and articles, drafts waiting for review, top articles this week. Business: revenue today, 7 and 30 days, orders, refunds, new leads. Community: open reports, new users. Super admin sees all. Date range picker.
**AD3 Global search.** Search users (name, email, phone), orders (orderNo), courses, articles, leads. Results grouped by type, filtered by permission.
**AD4 My admin profile.** Name, password change, reset 2FA, active sessions.

## 3. Content Studio

**CS1 Courses list.** Columns: thumbnail, title, category, price, status, enrolled, rating, updated. Filters: status, category, price type. Actions: New, Edit, Duplicate, Archive. Search by title.

**CS2 Course editor: details.** Tabs across CS2, CS3, CS6, CS7 for one course. Fields: title (required), slug (auto, editable, unique), subtitle, description (rich text), thumbnail (16:9, Cloudinary), preview video (optional), category, tags, level, language, instructors (multi), SEO. Status control with publish checklist (see below). Version history link.

**Publish checklist (blocks publishing):** title, slug, thumbnail, category, instructor, description at least 100 characters, at least 1 module and 3 published lessons, every video lesson has `mux.status = ready`, price set (0 allowed for free), if paid then iOS and Android IAP product ids present (or the "web only" flag).

**CS3 Curriculum builder.** Left: modules list; right: lessons in the selected module. Drag and drop reorder (modules and lessons), add module, add lesson (choose type), rename inline, mark required, mark free preview, remove (confirm). Shows total lessons and duration. Saves with `PUT /admin/courses/:id/curriculum`.

**CS4 Lesson editor.** Type switch:
- Video: direct upload to Mux with progress, status chip (uploading, processing, ready, errored), replace video, thumbnail, duration (read from Mux).
- Reading: rich text editor.
- Quiz: pick or create a quiz from CS18.
- Resource: list of files or links with titles.
Common fields: title, description, free preview, required, status (draft or published).

**CS5 Video upload and status.** Table of all Mux assets with lesson links, status, size, duration, errors; retry and delete (blocked if used).

**CS6 Pricing and access.** Price in rupees (stored as paise), compare-at price, free toggle, IAP product ids (iOS, Android), redeemable with points toggle, coupons that apply (read-only list with link to BC7), preview lessons summary.

**CS7 Course reviews (Later).** Pending, approved, rejected; approve, reject, delete; filter by rating.

**CS8 Categories and tags.** CRUD, order, icon. **CS9 Instructors.** CRUD with photo, bio, links.

**CS10 Books library / CS11 Book editor.** List with cover, title, format, free or paid, status. Editor: title, author, cover, description, format (PDF or summary), file upload (private) or summary rich text, category, tags, free or price, status.

**CS12 Videos library.** Standalone videos for the Videos tab: upload via Mux, title, description, thumbnail, topics, free, status.

**CS13 Articles list.** Columns: cover, title, topic, author, status, published date, views. Filters: status, topic, author, featured. Bulk: archive, feature.

**CS14 Article editor.** Title, slug, excerpt (max 200 characters), cover image + alt text, rich body (headings, bold, italic, lists, quotes, links, images, embeds off by default), primary topic and extra topics, tags, author, featured toggle, SEO fields, read time (auto, words / 200, editable). Preview (mobile frame), Save draft, Submit for review, Publish, Schedule (date-time in IST). Autosave every 30 seconds.

**CS15 Topics and categories.** CRUD topics, order, mark "show as tab" (For You is automatic). **CS16 Authors.** CRUD with title, bio, photo.

**CS17 Quizzes list.** Title, kind, questions, points, status. **CS18 Quiz and question bank editor.** Quiz settings (title, kind, points, time limit), questions: type (single, multi, true/false), prompt, options (2 to 6), correct answer(s), explanation (required), hint. Reorder, duplicate, preview. Publish requires at least 3 questions.
**CS19 CSV import.** Template download. Columns: `quiz_title, question, type, option_a..option_f, correct (for example A or A|C), explanation, hint`. Dry-run shows errors per row before import; max 500 rows.

**CS20 Brain games manager (Later).** Choose type, fill the config form (for example Match the Concept: pairs of term and meaning, 4 to 8 pairs), points, status.
**CS21 Scenario challenges editor (Later).** Intro, steps, options with outcome text and score effect, points, dates.

**CS22 Daily practice scheduler.** Calendar (week and month). For each date assign the five slots (Quick Quiz, Brain Game, Scenario Challenge, Match the Concept, Daily Reflection prompt) with points. Copy a week, auto-fill from a pool, warnings for empty future dates (next 7 days).

**CS23 Points and rules.** Points per activity, lesson points toggle, daily caps, streak bonus, free course cost (default 500). Changes apply to future awards only and are audit logged.

**CS24 Rewards catalogue.** Reward title, type (course access, coupon, badge), cost, linked course or coupon, stock, status.
**CS25 Achievements and badges (Later).** Key, title, description, icon, tier, rule type and threshold.

**CS26 Quotes and prompts library.** Tabs: quotes, manifestation words, reflection prompts. CRUD, CSV import, active toggle.

**CS27 Home curation.** Slots: featured courses, recommended courses, featured articles, Startup World hero. Drag to order, search to add, preview.
**CS28 Banners and announcements (Later).** Title, body, CTA, deep link, audience, dates, dismissible.

**CS29 Push composer.** Title (max 50), message (max 150), deep link picker (course, article, screen), segment (all, inactive 7 days, bought a course, topic followers, test device), send now or schedule, preview on a phone mock, send test to me. After sending: targeted, sent, opened.
**CS30 Notification templates (Later).** Reusable messages with placeholders.
**CS31 Content version history (Later).** List versions per entity, compare, restore.

## 4. Community and Users

**CU1 Users list.** Columns: avatar, name, email (masked), phone (masked), joined, status, courses, points. Search, filters (status, verified, joined date).
**CU2 User detail.** Profile, status, enrollments and progress, orders, points ledger, streak, projects, activity timeline, notes. Actions (permission based): suspend, ban, verify, grant a course (admin order), adjust points (reason required). Unmasking contact details is audit logged.
**CU3 Verification and badges (Later).** Queue of verification requests; grant or remove the Verified Founder badge.
**CU4 Reports queue (Later).** Filter by status, type, reason; oldest first. **CU5 Report detail and action (Later).** Content, reporter, history of the reported user; actions: dismiss, remove content, warn, suspend; internal note.
**CU6 Posts and comments browser (Later).** Search and filter; remove or restore.
**CU7 Moderation rules (Later).** Keyword and link rules (block, flag), spam thresholds, test a sample text.
**CU8 Suspended and banned users (Later).** List, reason, reinstate.
**CU9 SOFE Official publisher (Later).** Compose posts as the official account (text, image, link to course or article), schedule.
**CU10 Support inbox.** Ticket list (open, pending, closed), conversation view, reply (also emails the user), assign, close, canned replies.
**CU11 Community analytics (Later).** Posts per day, active posters, reports per 1,000 posts, top content.

## 5. Business Console

**BC1 Revenue dashboard.** Gross revenue, net revenue (after store commission and gateway fees), orders, average order value, refunds, by day or month chart, by course, by source (Razorpay, Apple, Google, points), top courses, comparison to previous period.
**BC2 Orders list.** orderNo, user, items, amount, source, status, date. Filters: status, source, date, course. Export.
**BC3 Order detail.** Items, price breakdown (discount, GST), payment details, timeline, enrollments created, invoice link, refund button (permission), resend receipt.
**BC4 Refunds and failed payments.** Two tabs: refunds (status, amount, reason) and failed or stuck payments (pending longer than 30 minutes) with a "re-check with provider" action. Refund dialog: full or partial, reason, effect on access (revoke or keep).
**BC5 Reconciliation (Later).** Import Razorpay settlement reports or use the API; match payouts to orders; mark discrepancies; record bank credit reference.
**BC6 Subscriptions (Later).** Placeholder until subscriptions exist.
**BC7 Coupons.** Code, type (percent or flat), value, limits, validity, applies to courses, status; usage count and revenue influenced.
**BC8 Invoices and GST.** List and PDF download; fields for buyer GSTIN and state; monthly GST summary export (taxable value, CGST, SGST, IGST). Numbering sequence per financial year. Confirm rules with your accountant.
**BC9 Leads pipeline.** Kanban (New, Contacted, Demo, Negotiation, Won, Lost) and table view. Filters: source, owner, date. Drag to change stage (Lost asks for a reason). Quick add and CSV import.
**BC10 Lead detail.** Contact, UTM, source, value, owner, tasks and follow-ups, activity timeline (notes, calls, emails), link to user or order, Bigin sync status.
**BC11 Lead sources and UTM (Later).** Leads, conversions and revenue by source and campaign; UTM link builder.
**BC12 Campaigns (Later).** Spend, leads, cost per lead, revenue.
**BC13 Expenses (Later).** CRUD with category, vendor, amount, receipt upload; monthly totals.
**BC14 Payouts (Later).** Instructor or affiliate share calculation by period, mark paid with reference.
**BC15 Funnel and retention.** Signup to first lesson to course view to purchase; day-1, day-7, day-30 retention; weekly active users; streak distribution. Data from `dailyStats` and PostHog.
**BC16 Reports and exports.** Pick a report (orders, revenue, refunds, GST, leads, expenses), date range, format (CSV or XLSX). Exports are audit logged.

## 6. Platform

**PL1 Admin users.** Invite by email (role assigned), disable, resend invite, reset 2FA. **PL2 Roles and permissions.** View the matrix; super admin can edit custom role permissions (fixed roles in v1 are read-only).
**PL3 Audit log.** Filter by actor, action, entity, date; view before and after; export.
**PL4 App config and feature flags.** Toggles: `networkEnabled`, `certificatesEnabled`; minimum app versions (force update); maintenance mode with message. Changes are confirmed and audit logged.
**PL5 Integrations status (Later).** Health of Razorpay, RevenueCat, Mux, Cloudinary, Firebase, Bigin, email; last webhook received; test buttons.
**PL6 Legal documents.** Edit Terms and Privacy as new versions; publish; users must re-accept when the version changes.

## 7. Zoho Bigin sync (business rules)

- New lead in SOFE creates a Bigin contact and deal; stage changes sync both ways every 10 minutes. SOFE is the source for source and UTM fields; Bigin is the source for owner assignment if both change.
- Paid buyers can be pushed to Bigin as contacts with the course name as a tag (optional setting).
- Sync failures show on PL5 and retry with backoff.
