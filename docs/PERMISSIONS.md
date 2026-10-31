# SOFE Roles, Permissions and Security

Permissions are enforced on the **server** (NestJS guards and service checks). Hiding a button in the UI is never enough.

## 1. Actors

| Actor | How they sign in | Stored in |
|---|---|---|
| Guest | none | none |
| Learner | Google, Apple, phone OTP (Firebase) | `users` |
| Admin staff | Email + password + TOTP 2FA (Firebase + app check) | `adminUsers` |
| System | Webhooks (signature verified), scheduled jobs | none |

## 2. Learner and guest rules

| Resource | Guest | Learner |
|---|---|---|
| Course catalogue, course detail, free preview lessons | Read | Read |
| Paid lesson content, resources, playback tokens | No | Only with `active` or `completed` enrollment |
| Free course lessons | No (sign in) | Read after enrolling (free enrollment is instant) |
| Articles, topics, authors | Read | Read, bookmark, follow topics |
| Books and videos | List and detail | Content if free or purchased |
| Practise, points, streak, plan, reflections, vision board, projects | No | Own data only |
| Profiles of others | Public fields | Public fields, subject to the owner's privacy setting and blocks |
| Posts and comments (v1.5) | Read public | Create, edit and delete own; like; follow; report; block |
| Orders, invoices, enrollments | No | Own only |
| Support tickets | No | Own only |
| Leads form | Create (rate limited, captcha) | Create |

**Object-level rule:** for any document with `userId`, the query is always filtered by the `userId` from the verified token. The request body and URL are never trusted to choose the owner. Add a test per module for "user A cannot read user B's data".

**Suspended users:** can sign in but all write actions return `ACCOUNT_SUSPENDED`.

## 3. Admin roles

| Role | Purpose |
|---|---|
| `super_admin` | Everything, including admins, roles, config |
| `content_editor` | Courses, articles, quizzes, rewards, curation, push |
| `moderator` | Reports, posts, comments, user suspension |
| `sales_support` | Leads, support inbox, read-only users and orders |
| `finance` | Orders, refunds, coupons, invoices, expenses, payouts, exports |

An admin can hold more than one role; permissions are the union.

## 4. Permission strings and role matrix

`R` = read, `W` = write (create, update), `D` = delete, `P` = publish, `X` = special action.

| Permission | super_admin | content_editor | moderator | sales_support | finance |
|---|---|---|---|---|---|
| `course:read` / `course:write` / `course:publish` | all | all | read | read | read |
| `lesson:*`, `media:*` | all | all | no | no | no |
| `article:read` / `write` / `publish` | all | all | read | no | no |
| `topic:*`, `author:*` | all | all | no | no | no |
| `quiz:*`, `practise:schedule`, `reward:*`, `achievement:*`, `quote:*` | all | all | no | no | no |
| `curation:write`, `banner:write` | all | all | no | no | no |
| `push:send` | all | all | no | no | no |
| `user:read` | all | no | all | all | no |
| `user:suspend`, `user:verify` | all | no | all | no | no |
| `report:read` / `report:action` | all | no | all | no | no |
| `post:remove`, `moderation:rules` | all | no | all | no | no |
| `support:read` / `support:reply` | all | no | read | all | no |
| `lead:read` / `lead:write` | all | no | no | all | read |
| `order:read` | all | no | no | read | all |
| `order:refund`, `order:manual` | all | no | no | no | all |
| `coupon:write` | all | no | no | no | all |
| `invoice:read` / `invoice:export` | all | no | no | no | all |
| `expense:*`, `payout:*`, `campaign:*` | all | no | no | no | all |
| `analytics:read` | all | content only | community only | leads only | business only |
| `report:export` | all | no | no | leads | all |
| `config:write`, `legal:write` | all | no | no | no | no |
| `admin:manage`, `role:manage`, `audit:read` | all | no | no | no | no |

Notes:
- Destructive actions (refund, delete, ban, unpublish with enrollments) need a confirm step and a reason, and are always audit logged.
- Refund above a configurable amount requires `super_admin` (for example Rs. 10,000).
- Publishing a course with active enrollments to draft is blocked.

## 5. Data protection

- Admin 2FA (TOTP) is mandatory for every admin account. Sessions expire after 8 hours of inactivity.
- Admins see only the personal data their role needs (support sees name, email; finance sees billing details; content editors see no user data).
- Personal data is not written to logs. Mask phone and email in admin lists (full view on detail, audit logged).
- DPDP Act: record consent at sign-up (Terms and Privacy versions accepted), allow export and deletion, keep retention minimal.
- Payment card data never touches our servers (Razorpay and the stores handle it).
- Backups are encrypted and access-restricted.

## 6. Application security checklist

1. **Secrets** only in environment variables or the host's secret manager. `.env` is git-ignored. Rotate if leaked.
2. **Guards on every route**, tested by a script that lists all routes and fails if any has no guard decorator.
3. **Input validation** with zod, unknown fields rejected, max sizes on strings and arrays.
4. **NoSQL injection:** never pass raw request objects into Mongo queries; build queries from validated fields; reject keys starting with `$` and containing `.` in input.
5. **Rich text:** sanitise HTML on save and render (allow-list tags); no raw HTML from users in the app.
6. **Uploads:** signed Cloudinary uploads with allowed formats, max size (images 5 MB, project files 20 MB), virus-scan or restrict file types for project files.
7. **Content access:** Mux signed playback tokens with short expiry, tied to the user; private files via signed URLs that expire in minutes.
8. **Payments:** verify webhook signatures; fulfil only from verified webhooks or verified store receipts; idempotent by provider event id and unique indexes; re-price on the server.
9. **Points and rewards:** server scoring only; idempotency keys; balance cannot go negative; daily caps.
10. **Rate limiting** per IP and per user; stricter on OTP, login, posting, search, lead form.
11. **CORS** restricted to the admin domain; admin cookies or tokens are HTTP-only where possible; CSRF protection if cookies are used.
12. **Headers:** helmet, HSTS, no stack traces in responses.
13. **Dependencies:** lockfile, automated vulnerability checks (Dependabot), no unpinned CDN scripts.
14. **Mobile:** store tokens in `expo-secure-store`; certificate pinning optional; no secrets in the bundle; obfuscate nothing sensitive client-side.
15. **Logging and alerts:** Sentry for errors; alert on webhook failures, refund spikes, many failed logins.
16. **Atlas:** IP allow list, per-environment users, backups, no public wildcard access in production.
17. **Moderation (v1.5):** server-side content filter, report flow, block lists respected in feeds, admin removal.
18. **Penetration review** before beta by someone other than the code author, focused on auth, object-level access, payments and uploads.

## 7. Tests that must exist

- Guard coverage: each route has a guard; role matrix cases for every admin permission group.
- Object-level access: learner A cannot read or change learner B's data.
- Enrollment gate: unpaid user cannot get lesson content or playback tokens.
- Webhooks: invalid signature rejected; duplicate event ignored; paid event creates exactly one enrollment.
- Points: duplicate submit awards once; redeem with insufficient points fails; concurrent redeem only succeeds once.
- Streak: timezone boundaries and the day rollover.
- Deletion: personal data removed or anonymised, orders retained.
