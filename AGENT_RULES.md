# Agent Rules for the SOFE repository

Read these before every task. If a task conflicts with a rule, stop and ask.

## Source of truth
- The `docs/` folder is the source of truth. Do not invent pages, fields, endpoints or permissions that are not in it. If something is missing, propose an addition and wait.
- Page IDs (for example `LN4`, `CS3`) in `docs/PAGES.md` are the unit of work. Build one page or one backend feature per task.

## Stack
- TypeScript everywhere. `strict` mode on. No `any` (use `unknown` and narrow).
- Monorepo with pnpm workspaces: `apps/mobile`, `apps/admin`, `apps/api`, `packages/shared`.
- Shared zod schemas and types live in `packages/shared`. Both apps and the API import from there. Do not duplicate types.
- MongoDB Atlas via Mongoose. Follow `docs/SCHEMA.md` exactly (field names, enums, indexes).
- REST API under `/api/v1`, documented with OpenAPI. Follow `docs/API.md`.

## Security (non-negotiable)
- Never put secrets, the Mongo URI, Razorpay secret, Mux secret or service keys in client code, in the repo, or in logs. Use environment variables and `.env.example`.
- Every API route has an explicit guard: `@Public()`, `@Auth()` (learner), or `@AdminAuth(permission)`. A route with no guard must fail the build (lint rule or test).
- Authorisation is enforced on the server. Hiding a button is not security.
- Learners may only read and write their own documents. Always filter by the authenticated `userId` from the token, never from the request body.
- Paid lessons: check an active enrollment on the server before returning a Mux signed playback token or any private file URL.
- Validate every request body, query and param with zod. Reject unknown fields.
- Payment and webhook handlers must verify signatures and be idempotent (use `webhookEvents` and unique indexes).
- Money is stored as integer paise (`priceInr`, `amountPaise`). Never use floats for money.
- Points are changed only by inserting into `pointsLedger` inside a transaction. Never edit a balance directly.
- Do not log personal data (phone, email, tokens).

## Code quality
- Small files and functions. One responsibility per module.
- Every new API endpoint gets: zod validation, a guard, a service method, a controller, OpenAPI decorators and at least one test.
- Use `async/await`, handle errors with the standard error envelope in `docs/API.md`.
- Use cursor pagination for lists. Never return unbounded lists.
- Add the indexes listed in `docs/SCHEMA.md` with the model, not later.
- Use database transactions (`withTransaction`) for purchase fulfilment, refunds, redemptions and points.

## UI (mobile and admin)
- Use only tokens from `packages/shared/src/theme.ts` and the components in `docs/DESIGN.md`. No hard-coded colours, font sizes or spacing numbers.
- Primary buttons use **navy text on orange**. Never white text on #FF8429.
- Orange **text** on light (cream or white) backgrounds uses `orangeDeep`, not `orange`.
- Every screen implements loading (skeleton), empty, error (with retry) and offline states.
- Every touchable is at least 44x44 pt and has an accessibility label. Respect system font scaling and reduced motion.
- Use `lucide-react-native` icons (mobile) and `lucide-react` (admin).
- Do not add a library without stating why. Prefer the ones listed in `README.md`.

## Process
- Work on one task from `docs/TASKS.md`. Do not touch files outside the task scope.
- Before coding, state a short plan (files you will create or change). After coding, list what changed and how to test it.
- Commit message format: `feat(LN4): course detail page` / `fix(api): idempotent razorpay webhook`.
- If a requirement is unclear, ask. Do not guess on payments, permissions or data deletion.
- Write tests for: permission guards, payment webhooks, points ledger, enrollment access, streak calculation.
