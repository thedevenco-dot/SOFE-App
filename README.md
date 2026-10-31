# SOFE — School of Founder Education

A mobile-first learning platform for aspiring founders.

**Learn · Create · Lead**

## Monorepo Structure

```
sofe/
├── apps/
│   ├── mobile/         # React Native + Expo (learners)
│   ├── admin/          # Next.js App Router (staff)
│   └── api/            # NestJS REST API
├── packages/
│   └── shared/         # Shared types, Zod schemas, theme tokens
└── docs/               # Project specifications
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the mobile app
pnpm dev:mobile

# Start the admin dashboard
pnpm dev:admin

# Start the API server
pnpm dev:api
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev:mobile` | Start Expo dev server |
| `pnpm dev:admin` | Start Next.js dev server |
| `pnpm dev:api` | Start NestJS dev server |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting |

## Documentation

See the [docs/](./docs/) directory for full project specifications:

- [Build Pack Overview](./docs/README.md) — Stack, repo layout, locked decisions
- [PRD](./docs/PRD.md) — Product requirements
- [Pages](./docs/PAGES.md) — All app and admin screens
- [Flows](./docs/FLOWS.md) — User and admin flows
- [Schema](./docs/SCHEMA.md) — Database schema
- [API](./docs/API.md) — REST API specification
- [Permissions](./docs/PERMISSIONS.md) — Roles and access rules
- [Design](./docs/DESIGN.md) — Design system
- [Admin Spec](./docs/ADMIN_SPEC.md) — Admin panel specification
- [Tasks](./docs/TASKS.md) — Build tasks

## Environment

Copy `.env.example` to `.env` and fill in the required values. See `.env.example` for all variables. Never commit `.env` files.

## Agent Rules

See [AGENT_RULES.md](./AGENT_RULES.md) for the coding rules that apply to every task.
