# GritCMS

A self-hostable **Creator Operating System** — everything you need to build, market, sell, and teach online, in one platform.

Built with **Go** (Gin + GORM) backend and **Next.js** (App Router) frontend in a **pnpm monorepo**.

## Features

- **Website Builder** — Pages, blog posts, navigation menus, themes, SEO
- **Email Marketing** — Lists, subscribers, campaigns, sequences, templates, analytics
- **Course Platform** — Courses, modules, lessons (text/video), enrollments, certificates, drip content
- **Products & Commerce** — Products, variants, pricing, orders, coupons, subscriptions
- **Contacts CRM** — Contacts, tags, segments, notes, activity timeline, analytics dashboard
- **Community** — Spaces, threads, replies, reactions, events, member management
- **Sales Funnels** — Multi-step funnels (opt-in, sales, webinar, launch), visit/conversion tracking
- **Booking Calendar** — Calendars, event types, availability, appointments, public booking
- **Premium Guides** — Gated PDF guides for subscribers, download tracking, referral analytics
- **Affiliate Management** — Programs, affiliates, referral links, commissions, payouts
- **Workflow Automation** — Visual workflow builder, triggers, actions, execution logs
- **AI Assist** — Content generation, email subjects, SEO descriptions, course summaries
- **Media Library** — File uploads with MinIO, Cloudflare R2, or Backblaze B2
- **OAuth Login** — Google and GitHub social login
- **Admin Dashboard** — Full admin panel with dark theme, command palette, onboarding wizard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | Go 1.22+, Gin, GORM, PostgreSQL |
| Frontend (web) | Next.js 16, React 19, Tailwind CSS |
| Frontend (admin) | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Cache & Queue | Redis |
| Object Storage | MinIO / Cloudflare R2 / Backblaze B2 |
| Email | Resend |
| Monorepo | pnpm workspaces + Turborepo |
| Data Fetching | TanStack React Query |
| Observability | Pulse (performance monitoring) |
| Security | Sentinel (WAF, rate limiting, threat detection) |

---

## Running Locally

### Prerequisites

- [Go 1.22+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/)
- [Air](https://github.com/air-verse/air) — `go install github.com/air-verse/air@latest`
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/atlasthanos-byte/gritcms.git
cd gritcms
pnpm install
```

### Step 2: Start Infrastructure Services

```bash
docker compose up -d
```

This starts **PostgreSQL** (`:5432`), **Redis** (`:6379`), **MinIO** (`:9000`/`:9001`), and **Mailhog** (`:8025`).

Verify everything is running:

```bash
docker compose ps
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Then fix the database name — the `.env.example` has a wrong default (`myapp`), the actual DB created by Docker Compose is `gritcms`:

```bash
sed -i 's|postgres://grit:grit@localhost:5432/myapp|postgres://grit:grit@localhost:5432/gritcms|' .env
```

Also disable Sentinel for local development (it blocks browser login requests):

```bash
sed -i 's/SENTINEL_ENABLED=true/SENTINEL_ENABLED=false/' .env
```

### Step 4: Start the Application

```bash
pnpm dev
```

This uses Turborepo to start the API (Air hot reload), admin panel, and public website in parallel.

### Step 5: Verify Everything Works

| Service | URL | What to check |
|---------|-----|---------------|
| **API Health** | http://localhost:8080/api/health | Should return `{"status":"ok"}` |
| **API Docs** | http://localhost:8080/docs | Interactive API documentation |
| **Admin Panel** | http://localhost:3001 | Register your first admin account |
| **Public Website** | http://localhost:3000 | Public-facing site |
| **Database Studio** | http://localhost:8080/studio | Browse database (login: admin/studio) |
| **Pulse Monitor** | http://localhost:8080/pulse | Performance dashboard (login: admin/pulse) |
| **Sentinel Security** | http://localhost:8080/sentinel | WAF dashboard (login: admin/sentinel) |
| **MinIO Console** | http://localhost:9001 | File storage (login: minioadmin/minioadmin) |
| **Mailhog** | http://localhost:8025 | Catches all outgoing emails in dev |

### Step 6: Create Your Admin Account

1. Open http://localhost:3001
2. Click **Register** and create your account
3. The first registered user automatically becomes the owner

### Step 7: Seed Default Content (Optional)

After logging in, seed default email templates, funnel templates, and a sample course:

```bash
# Get your token from the admin panel (browser DevTools → Application → localStorage)
curl -X POST http://localhost:8080/api/admin/seed-defaults \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This creates:
- 12 email templates (welcome, confirmation, order, booking, affiliate, etc.)
- 4 funnel templates (opt-in, sales page, webinar, launch)
- 1 sample course with 3 modules and 6 lessons

---

## Troubleshooting

### Go is not installed

**Error:** `bash: go: command not found`

Install Go 1.22+:

```bash
# Remove any old version first
sudo apt remove golang-go

# Download and install
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz

# Add to PATH permanently
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
```

---

### Air is not installed

**Error:** `sh: 1: air: not found`

Install Air (Go live-reload tool):

```bash
go install github.com/air-verse/air@latest
```

Then make sure Go's bin directory is in your PATH:

```bash
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
```

---

### pnpm is not installed

**Error:** `bash: pnpm: command not found`

Install pnpm:

```bash
npm install -g pnpm
```

If Node.js is also missing:

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Then install pnpm
npm install -g pnpm
```

---

### Docker is not installed

**Error:** `bash: docker: command not found`

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

Verify:

```bash
docker --version
docker compose version
```

---

### Database does not exist

**Error:** `FATAL: database "myapp" does not exist`

The `.env.example` has a wrong database name. The Docker Compose config creates a database named `gritcms`, not `myapp`. Fix it:

```bash
sed -i 's|postgres://grit:grit@localhost:5432/myapp|postgres://grit:grit@localhost:5432/gritcms|' .env
```

---

### Login returns 403 from the browser (but works via curl)

**Cause:** Sentinel WAF is blocking browser requests in development.

**Fix:** Disable Sentinel in `.env`:

```bash
sed -i 's/SENTINEL_ENABLED=true/SENTINEL_ENABLED=false/' .env
```

Then restart the API.

---

### Register endpoint returns validation error

**Error:** `Field validation for 'FirstName' failed on the 'required' tag`

The register endpoint requires `first_name` and `last_name` fields — not just `name`. Example:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword","first_name":"Your","last_name":"Name"}'
```

---

### API says DATABASE_URL is required

**Error:** `Failed to load config: DATABASE_URL is required`

You haven't created the `.env` file yet:

```bash
cp .env.example .env
```

---

### Docker containers start but nothing runs on port 8080

The Docker Compose file only starts infrastructure (Postgres, Redis, MinIO, Mailhog). The Go API runs separately via `pnpm dev` or `pnpm dev:api`. Make sure you run both:

```bash
# Terminal 1
docker compose up -d

# Terminal 2
pnpm dev
```

---

## Optional: Start Everything with One Script

Save this as `start.sh` in the project root:

```bash
#!/bin/bash
docker compose up -d
pnpm dev
```

Make it executable:

```bash
chmod +x start.sh
```

Then just run `./start.sh` every time.

---

## Individual Service Commands (for debugging)

```bash
# Go API only (port 8080)
pnpm dev:api

# Admin panel only (port 3001)
pnpm dev:admin

# Public website only (port 3000)
pnpm dev:web
```

---

## No Docker? No Problem

Use cloud services instead:

```bash
cp .env.cloud.example .env
```

Then fill in your keys for:
- **[Neon](https://neon.tech)** — PostgreSQL (free tier)
- **[Upstash](https://upstash.com)** — Redis (free tier)
- **[Cloudflare R2](https://dash.cloudflare.com)** — File storage (free tier)
- **[Resend](https://resend.com)** — Email (free tier)

No Docker needed — just your API keys and `pnpm dev`.

---

## Deploy to Production with Dokploy

[Dokploy](https://dokploy.com) is a self-hosted PaaS (like Vercel/Heroku) that runs on any VPS. GritCMS uses Docker Compose, which Dokploy supports natively.

### Prerequisites

- A VPS with **2GB+ RAM** (4GB recommended) — Hetzner, DigitalOcean, Contabo, etc.
- A domain name pointing to your VPS IP
- SSH access to the server

### Step 1: Install Dokploy on Your VPS

SSH into your server and run:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Once installed, access the Dokploy dashboard at `http://YOUR_VPS_IP:3000`. Create your admin account on first visit.

### Step 2: Set Up a Compose Project

1. In the Dokploy dashboard, click **Projects** → **Create Project**
2. Name it `gritcms`
3. Inside the project, click **Create Service** → **Compose**
4. Set the source:
   - **Provider**: Git (GitHub/GitLab/Bitbucket) or Docker Compose
   - **Repository**: Your GritCMS repo URL
   - **Branch**: `main` (or your production branch)
   - **Compose Path**: `docker-compose.prod.yml`

### Step 3: Configure Environment Variables

In the Dokploy service settings, go to **Environment** and add these variables:

```env
# Required — change these!
JWT_SECRET=your-secure-random-string-min-32-chars
APP_ENV=production
APP_URL=https://api.yourdomain.com

# Database (internal Docker network — no need to change)
DATABASE_URL=postgres://grit:grit@postgres:5432/gritcms?sslmode=disable

# Redis (internal Docker network)
REDIS_URL=redis://redis:6379

# Storage — pick one:
# Option A: MinIO (add minio service to compose, or use external)
STORAGE_DRIVER=minio
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your-minio-secret
MINIO_BUCKET=gritcms-uploads

# Option B: Cloudflare R2 (recommended for production)
# STORAGE_DRIVER=r2
# R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
# R2_ACCESS_KEY=your-r2-key
# R2_SECRET_KEY=your-r2-secret
# R2_BUCKET=gritcms-uploads
# R2_REGION=auto

# Email
RESEND_API_KEY=re_your_production_key
MAIL_FROM=noreply@yourdomain.com

# CORS — your frontend domains
CORS_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Frontend API URL (used at build time by Next.js)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# AI (optional)
AI_PROVIDER=claude
AI_API_KEY=sk-ant-your-key
AI_MODEL=claude-sonnet-4-5-20250929

# Observability
PULSE_ENABLED=true
PULSE_USERNAME=admin
PULSE_PASSWORD=your-secure-pulse-password

# Security
SENTINEL_ENABLED=true
SENTINEL_USERNAME=admin
SENTINEL_PASSWORD=your-secure-sentinel-password
SENTINEL_SECRET_KEY=your-secure-sentinel-secret

# GORM Studio (disable in production or set strong creds)
GORM_STUDIO_ENABLED=false
```

### Step 4: Configure Domains & SSL

You need **3 domains** (or subdomains):

| Service | Domain | Container Port |
|---------|--------|---------------|
| **API** | `api.yourdomain.com` | `8080` |
| **Web** | `yourdomain.com` | `3000` |
| **Admin** | `admin.yourdomain.com` | `3001` |

Make sure your DNS records point to the VPS IP:

```
A    yourdomain.com          → YOUR_VPS_IP
A    api.yourdomain.com      → YOUR_VPS_IP
A    admin.yourdomain.com    → YOUR_VPS_IP
```

### Step 5: Deploy

Click **Deploy** in Dokploy. First build takes 3-5 minutes.

### Alternative: Deploy Directly on Any VPS

```bash
ssh user@your-vps-ip
git clone https://github.com/your-org/gritcms.git
cd gritcms
cp .env.example .env
nano .env  # Set production values
chmod +x deploy.sh
./deploy.sh up
```

Then use **Caddy** as a reverse proxy:

```
# /etc/caddy/Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}

api.yourdomain.com {
    reverse_proxy localhost:8080
}

admin.yourdomain.com {
    reverse_proxy localhost:3001
}
```

### Backups

```bash
# Manual backup
./deploy.sh backup

# Automated daily backup (add to crontab)
0 3 * * * cd /path/to/gritcms && ./deploy.sh backup && mv backup_*.sql /backups/
```

### Updating

```bash
git pull origin main
./deploy.sh build
./deploy.sh up
```

---

## Project Structure

```
gritcms/
├── apps/
│   ├── api/                    # Go API server
│   │   ├── cmd/server/         # Entry point
│   │   ├── Dockerfile          # Multi-stage production build
│   │   └── internal/
│   │       ├── handlers/       # HTTP handlers (one per module)
│   │       ├── models/         # GORM models
│   │       ├── routes/         # Route registration
│   │       ├── middleware/      # Auth, CORS, cache, security headers
│   │       ├── services/       # Auth service, business logic
│   │       ├── mail/           # Email sending (Resend)
│   │       ├── ai/             # AI provider abstraction (Claude/OpenAI/Gemini)
│   │       ├── cache/          # Redis cache
│   │       ├── storage/        # Object storage (MinIO/R2/B2)
│   │       ├── jobs/           # Background job queue
│   │       ├── events/         # Event bus for cross-module communication
│   │       └── config/         # Environment configuration
│   ├── admin/                  # Admin panel (Next.js)
│   │   ├── Dockerfile          # Multi-stage production build
│   │   ├── app/(dashboard)/    # Dashboard pages
│   │   ├── components/         # UI components
│   │   ├── hooks/              # React Query hooks
│   │   └── lib/                # Utilities, API client
│   └── web/                    # Public website (Next.js)
│       ├── Dockerfile          # Multi-stage production build
│       ├── app/                # Public pages
│       ├── components/         # UI components
│       ├── hooks/              # React Query hooks
│       └── lib/                # Utilities, API client
├── packages/
│   └── shared/
│       └── types/              # Shared TypeScript types
├── docker-compose.yml          # Development (Postgres, Redis, MinIO, Mailhog)
├── docker-compose.prod.yml     # Production (API, Web, Admin, Postgres, Redis)
├── deploy.sh                   # One-command deployment script
├── .env.example                # Environment variable template
└── .env.cloud.example          # Cloud-only env template (no Docker)
```

## Environment Variables

See [.env.example](.env.example) for all available options. Key variables:

| Variable | Description |
|----------|-------------|
| `APP_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing (**change in production!**) |
| `REDIS_URL` | Redis connection string |
| `STORAGE_DRIVER` | `minio`, `r2`, or `b2` |
| `RESEND_API_KEY` | Resend API key for email |
| `AI_PROVIDER` | `claude`, `openai`, or `gemini` |
| `AI_API_KEY` | API key for AI provider |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SENTINEL_ENABLED` | Enable WAF & rate limiting (disable in local dev) |
| `PULSE_ENABLED` | Enable performance monitoring |

## API Endpoints

All admin endpoints require JWT authentication via `Authorization: Bearer <token>`.

### Public Routes
- `GET /api/health` — Health check
- `GET /api/theme` — Site theme settings
- `GET /api/blog/posts` — Published blog posts
- `GET /api/pages/:slug` — Published pages
- `GET /api/courses` — Published courses
- `GET /api/products` — Published products
- `GET /api/community/spaces` — Public community spaces
- `GET /api/funnels/:slug` — Public funnel pages
- `GET /api/book/:slug` — Public booking page
- `GET /api/guides` — Published premium guides
- `GET /api/guides/:slug` — Guide detail with access gate
- `GET /api/ref/:code` — Affiliate referral tracking

### Admin Routes (`/api/admin/...`)
Full CRUD for: pages, posts, contacts, email lists, campaigns, courses, products, orders, community, funnels, booking, affiliates, workflows, media, settings, and users.

### Interactive Docs
Visit `/docs` on your API URL for auto-generated API documentation.

## Built-in Tools

| Tool | URL | Description |
|------|-----|-------------|
| **GORM Studio** | `/studio` | Visual database browser and query tool |
| **API Docs** | `/docs` | Auto-generated API documentation |
| **Pulse** | `/pulse` | Performance monitoring, request tracing, error tracking |
| **Sentinel** | `/sentinel` | WAF, rate limiting, anomaly detection, security dashboard |

## License

MIT
