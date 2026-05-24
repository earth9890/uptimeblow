# Uptimeblow — MVP Specification

## Vision
Beautiful, affordable uptime monitoring with built-in incident management. The tool indie hackers and small teams actually want.

**Domain:** uptimeblow.com
**Tagline:** "Beautiful uptime monitoring that won't blow your budget."

---

## Architecture Overview

```
                    ┌──────────────────────┐
                    │   Next.js Frontend   │
                    │   (Vercel)           │
                    └──────────┬───────────┘
                               │ REST API
                    ┌──────────▼───────────┐
                    │  Fastify Backend     │
                    │  (AWS EC2/ECS)       │
                    ├──────────────────────┤
                    │  - Auth (JWT)        │
                    │  - Monitor CRUD      │
                    │  - Alert Engine      │
                    │  - Incident Mgmt     │
                    │  - Status Pages      │
                    └───┬──────────┬───────┘
                        │          │
               ┌────────▼──┐  ┌───▼────────┐
               │ PostgreSQL │  │   Redis    │
               │ (RDS)     │  │ (Queue +   │
               │           │  │  Cache)    │
               └───────────┘  └────────────┘
                        │
               ┌────────▼──────────┐
               │  Check Workers    │
               │  (Multi-region)   │
               │  Bull Queue       │
               └───────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR, great DX, Vercel deploy |
| UI | Tailwind CSS + shadcn/ui | Beautiful, fast to build |
| Backend | Fastify (Node.js) | 2-3x faster than Express, TypeScript-first, great plugin system |
| Database | PostgreSQL | Reliable, great for time-series with partitioning |
| Cache/Queue | Redis + BullMQ | Job scheduling for monitor checks |
| Auth | Better Auth or Lucia | Modern, lightweight auth |
| ORM | Drizzle ORM | Type-safe, fast, great PostgreSQL support |
| Email | Resend | Simple transactional emails |
| Deployment FE | Vercel | Zero-config Next.js |
| Deployment BE | AWS (EC2 or ECS) | Scalable, self-managed |

---

## Pricing Strategy (MVP)

| Tier | Price | Monitors | Interval | Key Features |
|---|---|---|---|---|
| **Free** | $0 | 25 | 2 min | HTTP/ping/port, email alerts, 1 status page |
| **Starter** | $9/mo | 100 | 1 min | SMS/Slack/Discord, basic incidents, 3 status pages |
| **Pro** | $29/mo | 500 | 30 sec | On-call scheduling, escalations, unlimited status pages |
| **Business** | $69/mo | 2000 | 30 sec | Team management, SSO, priority support |

**Why this beats competitors:**
- Free tier: 2-min interval beats UptimeRobot (5-min) and StatusCake (5-min)
- $9 Starter includes incident management (Better Stack charges $24 for this)
- $29 Pro is cheaper than Better Stack's $48 Pro with similar features

---

## MVP Features (Phase 1)

### 1. Authentication & User Management
- Email/password signup + login
- OAuth (Google, GitHub)
- Email verification
- Password reset
- User profile/settings

### 2. Monitor Management
- **Monitor types:** HTTP(S), Ping, Port, Keyword
- **Check configuration:**
  - URL/host/port input
  - Check interval (30s, 1m, 2m, 5m based on plan)
  - Timeout threshold
  - Expected status codes
  - Keyword presence/absence
- **Multi-region checks:** At least 3 regions (US-East, EU-West, AP-Southeast)
- **Dashboard:** Real-time status grid, uptime %, response time charts

### 3. Alert System
- **Channels:** Email (free), Slack, Discord, Webhook (paid)
- **Alert rules:**
  - Alert after N consecutive failures (configurable, default 3)
  - Recovery notification
  - Alert cooldown period
- **Alert history:** Log of all sent alerts with timestamps

### 4. Incident Management (Key Differentiator)
- Auto-create incident on monitor failure
- Manual incident creation
- Incident timeline (events, updates, resolution)
- Incident severity levels (minor, major, critical)
- Post-incident notes
- On-call assignment (Pro+)

### 5. Status Pages (Key Differentiator)
- Custom subdomain (e.g., status.yourcompany.com)
- Beautiful, modern design (this is where we beat UptimeRobot)
- Show/hide specific monitors
- Custom branding (logo, colors)
- Incident history display
- Uptime history (30/60/90 day bars)
- Subscribe to updates (email)

### 6. Dashboard & Analytics
- Overall uptime percentage
- Response time graphs (24h, 7d, 30d, 90d)
- Downtime log with duration
- Average response time per monitor
- Uptime report export (PDF — Pro+)

---

## Database Schema (Core Tables)

```sql
-- Users & Auth
users (id, email, name, password_hash, avatar_url, plan, created_at, updated_at)
sessions (id, user_id, token, expires_at)
oauth_accounts (id, user_id, provider, provider_id)

-- Teams (future, but schema-ready)
teams (id, name, owner_id, plan, created_at)
team_members (id, team_id, user_id, role)

-- Monitors
monitors (id, user_id, name, type, url, method, interval_seconds,
          timeout_ms, expected_status, keyword, keyword_type,
          regions, is_paused, alert_threshold, created_at, updated_at)

-- Check Results (partitioned by month for performance)
check_results (id, monitor_id, region, status, response_time_ms,
               status_code, error_message, checked_at)

-- Alerts
alert_channels (id, user_id, type, config_json, is_default, created_at)
alert_history (id, monitor_id, channel_id, type, message, sent_at)

-- Incidents
incidents (id, user_id, monitor_id, title, severity, status,
           started_at, resolved_at, created_at, updated_at)
incident_updates (id, incident_id, message, status, created_by, created_at)

-- Status Pages
status_pages (id, user_id, slug, name, custom_domain, logo_url,
              brand_color, is_public, created_at, updated_at)
status_page_monitors (id, status_page_id, monitor_id, display_name, sort_order)
status_page_subscribers (id, status_page_id, email, confirmed, created_at)

-- Plans & Billing
subscriptions (id, user_id, plan, status, stripe_subscription_id,
               current_period_start, current_period_end, created_at)
```

---

## Check Worker Architecture

```
BullMQ Scheduler
    │
    ├── Repeatable jobs per monitor (based on interval)
    │
    ▼
Worker Pool (can scale horizontally)
    │
    ├── Execute check (HTTP/ping/port)
    ├── Store result in PostgreSQL
    ├── Evaluate alert threshold
    │     └── If threshold met → dispatch alert job
    │     └── If recovered → dispatch recovery job
    ├── Update monitor status cache (Redis)
    └── If status changed → create/update incident
```

**Multi-region strategy (MVP):**
- Start with 1 primary region (worker runs on same server)
- Add 2-3 satellite workers (lightweight EC2 instances or Lambda) that:
  - Receive check jobs via Redis
  - Report results back to main server
- A check is "failed" only if 2+ regions agree (prevents false positives)

---

## API Endpoints (MVP)

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET  /api/auth/me

### Monitors
- GET    /api/monitors
- POST   /api/monitors
- GET    /api/monitors/:id
- PATCH  /api/monitors/:id
- DELETE /api/monitors/:id
- POST   /api/monitors/:id/pause
- POST   /api/monitors/:id/resume
- GET    /api/monitors/:id/checks?range=24h|7d|30d|90d

### Incidents
- GET    /api/incidents
- POST   /api/incidents
- GET    /api/incidents/:id
- PATCH  /api/incidents/:id
- POST   /api/incidents/:id/updates
- POST   /api/incidents/:id/resolve

### Alerts
- GET    /api/alert-channels
- POST   /api/alert-channels
- PATCH  /api/alert-channels/:id
- DELETE /api/alert-channels/:id
- POST   /api/alert-channels/:id/test
- GET    /api/alerts/history

### Status Pages
- GET    /api/status-pages
- POST   /api/status-pages
- GET    /api/status-pages/:id
- PATCH  /api/status-pages/:id
- DELETE /api/status-pages/:id
- POST   /api/status-pages/:id/monitors
- DELETE /api/status-pages/:id/monitors/:monitorId

### Dashboard
- GET    /api/dashboard/overview
- GET    /api/dashboard/stats

### Public (Status Page)
- GET    /status/:slug (SSR page)
- POST   /status/:slug/subscribe

---

## Project Structure

```
uptimeblow/
├── apps/
│   ├── web/                    # Next.js frontend (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, register, forgot-password
│   │   │   ├── (dashboard)/    # Main app pages
│   │   │   │   ├── monitors/
│   │   │   │   ├── incidents/
│   │   │   │   ├── status-pages/
│   │   │   │   ├── alerts/
│   │   │   │   └── settings/
│   │   │   ├── status/[slug]/  # Public status pages (SSR)
│   │   │   └── (marketing)/    # Landing page, pricing
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   │
│   └── api/                    # Fastify backend (AWS)
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── workers/        # BullMQ check workers
│       │   ├── db/
│       │   │   ├── schema/     # Drizzle schema
│       │   │   └── migrations/
│       │   ├── plugins/        # Fastify plugins (auth, etc.)
│       │   └── utils/
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types, constants
│       ├── types/
│       └── constants/
│
├── docs/
├── tasks/
├── turbo.json                  # Turborepo config
├── package.json
└── pnpm-workspace.yaml
```

---

## MVP Milestones

### Phase 1A — Foundation (Week 1-2)
- Monorepo setup (Turborepo + pnpm)
- Database schema + migrations (Drizzle)
- Auth system (register, login, OAuth)
- Basic Fastify API structure
- Next.js app with auth pages

### Phase 1B — Core Monitoring (Week 3-4)
- Monitor CRUD API + UI
- Check worker (HTTP checks first)
- BullMQ job scheduling
- Check result storage
- Real-time dashboard with uptime stats

### Phase 1C — Alerts & Incidents (Week 5-6)
- Alert channel management (email, Slack, Discord, webhook)
- Alert evaluation engine
- Incident auto-creation on failure
- Incident management UI
- Incident timeline

### Phase 1D — Status Pages (Week 7-8)
- Status page builder UI
- Public status page rendering (SSR)
- Custom subdomain support
- Subscriber management
- Beautiful design (key differentiator)

### Phase 1E — Polish & Launch (Week 9-10)
- Landing page + pricing page
- Stripe billing integration
- Plan enforcement (limits)
- Multi-region checks (2-3 regions)
- Performance optimization
- Launch on Product Hunt

---

## Key Design Principles

1. **Speed** — Dashboard loads in <1s. No loading spinners everywhere.
2. **Beauty** — Every page should look Better Stack quality or better.
3. **Simplicity** — A non-technical person can set up monitoring in 60 seconds.
4. **Reliability** — The monitoring service itself must have 99.99% uptime.
5. **Transparency** — Show real data, no vanity metrics.
