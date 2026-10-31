# SOFE Environment & Deployment Architecture

This document specifies the multi-environment topology, database partitioning, secrets management, and CI/CD pipelines across the SOFE platform.

---

## 1. Environment Topology

| Environment | Purpose | Target URL / Host | MongoDB Database | Branch |
|---|---|---|---|---|
| **Development** | Local feature development & testing | `http://localhost:4000` (API)<br>`http://localhost:3000` (Admin)<br>`http://localhost:8081` (Mobile) | `sofe_dev` (Local or Atlas M0) | Feature branches |
| **Staging** | Pre-release QA & integration validation | `https://api-staging.sofe.edu`<br>`https://admin-staging.sofe.edu` | `sofe_staging` (Atlas Dedicated) | `develop` |
| **Production** | Live end-user traffic | `https://api.sofe.edu`<br>`https://admin.sofe.edu` | `sofe_prod` (Atlas M10+ ap-south-1) | `main` (Tags `v*.*.*`) |

---

## 2. Database Partitioning & Security

In compliance with `SCHEMA.md`:
1. **Isolated Clusters & Users:** Never reuse database credentials between environments. Staging and production run on separate database users with strictly limited IP allowlists.
2. **Migrations:** Database indexes and structural changes are managed via `pnpm db:migrate`. The migration script runs in CI prior to container deployment.
3. **No AutoIndex:** NestJS Mongoose models do not rely on `autoIndex: true` in production. Indexes must be created and verified by migrations.

---

## 3. GitHub Actions Workflows

The repository includes three automated workflows in `.github/workflows/`:

### A. Continuous Integration (`ci.yml`)
- **Triggers:** Pull Requests and pushes to `main` and `develop`.
- **Pipeline:**
  1. `pnpm format:check` (Prettier code consistency)
  2. `pnpm lint` (ESLint across all packages)
  3. `pnpm typecheck` (TypeScript strict mode)
  4. `pnpm test` (Full unit & integration test suites)
  5. `pnpm build` (Compilation of `@sofe/shared`, `@sofe/api`, and `@sofe/admin`)

### B. Staging Deployment (`deploy-staging.yml`)
- **Triggers:** Push to `develop` or manual `workflow_dispatch`.
- **Pipeline:**
  1. Full validation check.
  2. Runs index migration on `sofe_staging`.
  3. Triggers API deploy webhook for staging container.
  4. Deploys Admin panel to Vercel staging preview.

### C. Production Release (`deploy-production.yml`)
- **Triggers:** Push of release tags (e.g. `v1.0.0`) or manual `workflow_dispatch`.
- **Pipeline:**
  1. Full validation check.
  2. Runs index migration on `sofe_prod`.
  3. Triggers production API deployment.
  4. Deploys Admin panel to Vercel production (`vercel --prod`).

---

## 4. Required GitHub Secrets

Configure these repository secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Description |
|---|---|
| `STAGING_MONGODB_URI` | Atlas MongoDB connection string for `sofe_staging` |
| `STAGING_API_DEPLOY_HOOK_URL` | Webhook URL to trigger staging API rebuild (Railway/Render) |
| `PROD_MONGODB_URI` | Atlas MongoDB connection string for `sofe_prod` |
| `PROD_API_DEPLOY_HOOK_URL` | Webhook URL to trigger production API deployment |
| `VERCEL_TOKEN` | Vercel personal access token for admin deployments |
| `VERCEL_ORG_ID` | Vercel team/organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID for `@sofe/admin` |

