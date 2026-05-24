# Uptimeblow — MVP Task Tracker

## Phase 1A — Monorepo & Foundation
- [x] Step 1: Monorepo setup (Turborepo + pnpm)
- [x] Step 2: Database schema & migrations (Drizzle)
- [x] Step 3: Fastify API bootstrap
- [x] Step 4: Shared package (types + constants)
- [x] Step 5: Next.js frontend bootstrap

## Phase 1B — Auth System
- [x] Step 6: Backend auth (JWT, OAuth, email verification)
- [x] Step 7: Frontend auth pages
- [x] Step 8: User settings

## Phase 1C — Core Monitoring
- [x] Step 9: Monitor CRUD API
- [x] Step 10: Check worker system (BullMQ)
- [x] Step 11: Alert evaluation engine
- [x] Step 12: Monitor dashboard UI
- [x] Step 13: Dashboard overview

## Phase 1D — Alerts & Incidents
- [x] Step 14: Alert channel management API
- [x] Step 15: Alert UI
- [x] Step 16: Incident management API
- [x] Step 17: Incident management UI

## Phase 1E — Status Pages
- [x] Step 18: Status page API
- [x] Step 19: Status page builder UI
- [x] Step 20: Public status page (SSR)
- [x] Step 21: Status page notifications (via alert-evaluator auto-incident)

## Phase 1F — Billing & Launch
- [x] Step 22: Stripe integration
- [x] Step 23: Landing page + pricing page
- [ ] Step 24: Multi-region checks (requires infrastructure — deferred)
- [ ] Step 25: Final polish & deploy (requires AWS/Vercel setup — deferred)

## Review
### What was built
- Full Turborepo monorepo: `apps/web` (Next.js 16), `apps/api` (Fastify 5), `packages/shared`
- 13 database tables with Drizzle ORM (users, monitors, check_results, alerts, incidents, status pages, subscriptions)
- Complete auth system: JWT + refresh tokens, Google/GitHub OAuth, email verification, password reset
- Monitor CRUD with plan-based limits, 3 checkers (HTTP, ping, port), BullMQ worker system
- Alert evaluation engine with 4 notifiers (email, Slack, Discord, webhook), auto-incident creation
- Full incident management with timeline, status updates, auto-resolve on recovery
- Status page builder + beautiful public SSR status page
- Stripe billing: checkout sessions, customer portal, webhook handler
- Landing page with competitor comparison + pricing page

### Verification
- API: TypeScript compiles clean (0 errors)
- Web: Next.js builds clean (18 routes, 0 errors)
- All workspace packages resolve correctly

### Remaining for launch
- Set up PostgreSQL + Redis (local or cloud)
- Run `drizzle-kit push` to create database tables
- Configure environment variables (.env from .env.example)
- Deploy: `vercel` for frontend, AWS EC2/ECS for API
- Set up Stripe products/prices and configure webhook endpoint
- DNS setup for uptimeblow.com
