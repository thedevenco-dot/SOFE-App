# SOFE (School of Founder Education): Build Pack

Spec files for building the SOFE mobile app, admin web app and API with Antigravity.
Learn - Create - Lead.

## What is in this pack

| File | Purpose |
|---|---|
| `README.md` | This file: stack, repo layout, locked decisions, how to use the pack |
| `AGENT_RULES.md` | Rules the coding agent must follow on every task (paste into Antigravity's rules) |
| `.env.example` | Every environment variable the project needs |
| `docs/PRD.md` | Product requirements, scope, acceptance criteria, analytics events |
| `docs/PAGES.md` | All 88 app screens and 68 admin pages, with IDs, routes and waves |
| `docs/FLOWS.md` | User flows, admin flows and state machines |
| `docs/SCHEMA.md` | MongoDB Atlas collections, fields, indexes, transactions |
| `docs/API.md` | REST API conventions and endpoint list |
| `docs/PERMISSIONS.md` | Roles, permissions, access rules, security checklist |
| `docs/ADMIN_SPEC.md` | Admin panel specification page by page |
| `docs/DESIGN.md` | Design system: tokens, type, components, accessibility |
| `docs/TASKS.md` | Ordered build tasks with acceptance criteria and a prompt template |
| `packages/shared/src/theme.ts` | Design tokens as code (copy into the repo as is) |

## Locked decisions

| Area | Decision |
|---|---|
| Database | **MongoDB Atlas** (M0 for dev, M10+ dedicated for staging and production) |
| API | **Node.js + NestJS (TypeScript)** with **Mongoose**, REST, OpenAPI docs |
| Mobile app | **React Native + Expo** (TypeScript), Expo Router, NativeWind, TanStack Query, Zustand |
| Admin app | **Next.js** (App Router, TypeScript), shadcn/ui, TanStack Table, Tiptap editor |
| Auth | **Firebase Auth** (Google, Apple, phone OTP for learners; email + password for admins). API verifies Firebase ID tokens |
| Images / video | **Cloudinary** (images, files) and **Mux** (course video, signed playback) |
| Payments | **Razorpay** (web checkout) and **RevenueCat** (in-app purchases on iOS and Android) |
| Push | Expo Notifications (FCM and APNs) |
| Email | Resend |
| Search | MongoDB Atlas Search |
| Analytics / errors | PostHog / Sentry |
| CRM | Zoho Bigin, synced by webhook |
| Hosting | API on Railway or Render; admin on Vercel; mobile builds on Expo EAS; marketing site on Framer |
| Monorepo | pnpm workspaces |

## Defaults assumed for open questions (change here if you disagree)

1. **Monetisation (v1):** one-time paid courses plus free courses. Learners can also redeem **500 points = 1 free course**. Subscriptions are reserved in the schema but not built.
2. **Payment route:** in the iOS and Android apps, courses are sold with in-app purchase through RevenueCat. Razorpay is used for web checkout and admin-created orders. All routes end in one `orders` and `enrollments` record. Confirm against current Apple and Google rules before launch.
3. **Network (v1.5):** **follow-only** model. The 1st and 2nd connection labels in the mockup are dropped. A `connections` collection is reserved.
4. **Books:** a book is either a PDF opened in an in-app viewer or a text summary. No audio in v1.
5. **Certificates:** generated as a PDF on course completion (feature flag `certificatesEnabled`).
6. **Guest browsing:** guests can browse Startup World and the course catalogue. Any action (bookmark, buy, start a lesson) asks them to sign in.
7. **Tabs:** the mobile app has 6 tabs (Home, Learn, Practise, Startup World, Network, Profile). Network is hidden in v1 by the flag `networkEnabled`.
8. **Points defaults (from the mockup):** Quick Quiz +10, Brain Game +10, Scenario Challenge +20, Match the Concept +10, Daily Reflection +5. Admin can change these.
9. **Timezone:** days (streaks, daily plan) are computed in the user's timezone, default `Asia/Kolkata`.

## Repo layout

```
sofe/
  apps/
    mobile/        Expo app (learners)
    admin/         Next.js admin (staff)
    api/           NestJS API
  packages/
    shared/        zod schemas, TypeScript types, constants, theme.ts
  docs/            the files in this pack
  AGENT_RULES.md
  .env.example
  pnpm-workspace.yaml
```

## How to use this pack with Antigravity

1. Create the GitHub repo, copy this pack in (keep `docs/` as is) and commit.
2. Paste `AGENT_RULES.md` into Antigravity's project rules (check its current docs for the exact location and file name).
3. Open `docs/TASKS.md` and do the tasks **in order, one at a time**. Use the prompt template at the top of that file.
4. After each task: run it, test it, read the diff, commit. Do not stack several tasks in one prompt.
5. For anything touching auth, payments, permissions or points, review the code yourself before merging.
6. When a spec file changes, change the file first, then ask the agent to update the code.

## Order of reading for a new person

README, PRD, PAGES, FLOWS, SCHEMA, PERMISSIONS, API, ADMIN_SPEC, DESIGN, TASKS.
