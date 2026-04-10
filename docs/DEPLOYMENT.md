# GritCMS — Dokploy Deployment Guide

## Prerequisites

- A VPS with **minimum 2GB RAM, 30GB disk** (4GB+ recommended)
- Ubuntu 20.04+ (or Debian 10+, Fedora 40, CentOS 8-9)
- A domain name (e.g., `yourdomain.com`)
- Your GritCMS repo pushed to GitHub / GitLab / Gitea

## Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │                   Dokploy                     │
                    │              (Traefik reverse proxy)          │
                    │                                               │
  yourdomain.com ──►│  web    (Next.js)  :3000                     │
admin.yourdomain ──►│  admin  (Next.js)  :3001                     │
  api.yourdomain ──►│  api    (Go/Gin)   :8080                     │
                    │                                               │
                    │  postgres (PostgreSQL 16)  :5432              │
                    │  redis    (Redis 7)        :6379              │
                    │  minio    (MinIO S3)       :9000              │
                    └──────────────────────────────────────────────┘
```

---

## Step 1: Install Dokploy on Your VPS

```bash
ssh root@your-vps-ip
curl -sSL https://dokploy.com/install.sh | sh
```

After installation (~5 minutes), access Dokploy at:
```
http://your-vps-ip:3000
```

Create your Dokploy admin account on the setup page.

---

## Step 2: Point DNS to Your VPS

Add these A records in your DNS provider:

| Record | Type | Value          |
|--------|------|----------------|
| `@` (or `yourdomain.com`)    | A | `your-vps-ip` |
| `admin` | A | `your-vps-ip` |
| `api`   | A | `your-vps-ip` |

Wait for DNS propagation (usually 5-15 minutes).

---

## Step 3: Create a Project in Dokploy

1. Log into Dokploy dashboard
2. **Projects** → **Create Project** → Name it `GritCMS`

---

## Step 4: Add Docker Compose Service

1. Inside the `GritCMS` project → **Add Service** → **Docker Compose**
2. **Source**: Connect your Git repository (GitHub / GitLab / Gitea)
3. **Compose Path**: `docker-compose.prod.yml`
4. **Build Context**: `.` (repository root)

---

## Step 5: Configure Environment Variables

In Dokploy → your service → **Environment** tab, add:

```env
# ─── REQUIRED ────────────────────────────────────────────────
JWT_SECRET=generate-a-64-char-random-string
POSTGRES_USER=grit
POSTGRES_PASSWORD=use-a-strong-password-here
POSTGRES_DB=gritcms

# ─── DOMAINS (update to your actual domains) ────────────────
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# ─── STORAGE ─────────────────────────────────────────────────
# MinIO is included in the compose file (default)
STORAGE_DRIVER=minio
MINIO_ACCESS_KEY=generate-a-key
MINIO_SECRET_KEY=generate-a-secret
MINIO_BUCKET=uploads

# Or use Cloudflare R2 instead:
# STORAGE_DRIVER=r2
# R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
# R2_ACCESS_KEY=your-r2-key
# R2_SECRET_KEY=your-r2-secret
# R2_BUCKET=uploads

# ─── EMAIL (Resend — resend.com) ────────────────────────────
RESEND_API_KEY=re_your_api_key
MAIL_FROM=hello@yourdomain.com

# ─── SECURITY (change defaults!) ────────────────────────────
SENTINEL_ENABLED=true
SENTINEL_USERNAME=admin
SENTINEL_PASSWORD=your-sentinel-password
SENTINEL_SECRET_KEY=your-sentinel-secret
PULSE_ENABLED=true
PULSE_USERNAME=admin
PULSE_PASSWORD=your-pulse-password

# ─── AI (optional) ──────────────────────────────────────────
# AI_PROVIDER=claude
# AI_API_KEY=sk-ant-your-key
# AI_MODEL=claude-sonnet-4-5-20250929

# ─── OAUTH (optional) ───────────────────────────────────────
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# OAUTH_FRONTEND_URL=https://admin.yourdomain.com
```

> **Tip**: Generate secure secrets with: `openssl rand -hex 32`

---

## Step 6: Configure Domains & SSL

In Dokploy → your Docker Compose service → **Domains** tab:

| Service | Domain                    | Container Port | HTTPS |
|---------|---------------------------|----------------|-------|
| `web`   | `yourdomain.com`          | 3000           | Yes   |
| `admin` | `admin.yourdomain.com`    | 3001           | Yes   |
| `api`   | `api.yourdomain.com`      | 8080           | Yes   |

Dokploy uses Traefik and automatically provisions **Let's Encrypt** SSL certificates.

---

## Step 7: Deploy

Click **Deploy** in Dokploy. The build process will:

1. Pull your code from Git
2. Build Docker images for API (Go), Web (Next.js), Admin (Next.js)
3. Start PostgreSQL, Redis, MinIO
4. Start the API server (auto-migrates the database on first run)
5. Start Web and Admin frontends

> First build takes ~5-10 minutes. Subsequent deploys are faster due to Docker cache.

---

## Step 8: Initial Setup

1. Visit `https://admin.yourdomain.com`
2. Register your admin account (first user becomes admin)
3. The **Setup Wizard** appears automatically:
   - Enter your site name and tagline
   - Create your first email list
   - Click "Go to Dashboard" → saves settings + creates your Home page
4. Visit `https://yourdomain.com` to see your live site

---

## Updating / Redeploying

**Manual**: Dokploy dashboard → your service → **Deploy**

**Auto-deploy via webhook**:
1. Dokploy → your service → **Deployments** → copy the webhook URL
2. Add it as a webhook in your GitHub/GitLab repo settings
3. Every push to `main` triggers a redeploy

---

## Backups

### PostgreSQL
```bash
# SSH into your VPS, then:
docker exec gritcms-postgres pg_dump -U grit gritcms > backup_$(date +%Y%m%d).sql
```

### Dokploy Built-in
Dokploy dashboard → **Settings** → **Backups** → configure S3 destination for automatic backups.

### Volumes
PostgreSQL data, Redis data, and MinIO uploads are stored in Docker named volumes:
- `postgres-data`
- `redis-data`
- `minio-data`

---

## Monitoring & Logs

- **Dokploy**: Built-in container logs and resource monitoring
- **Pulse**: `https://api.yourdomain.com/pulse` (login with PULSE_USERNAME/PASSWORD)
- **Sentinel**: `https://api.yourdomain.com/sentinel` (login with SENTINEL_USERNAME/PASSWORD)
- **GORM Studio**: `https://api.yourdomain.com/studio` (disabled by default in production)

---

## Scaling Tips

| VPS Size | Suitable For |
|----------|-------------|
| 2GB RAM  | Development / testing |
| 4GB RAM  | Small creator site (< 10k monthly visitors) |
| 8GB RAM  | Medium site (10k-100k monthly visitors) |
| 16GB RAM | Large site (100k+ monthly visitors) |

For high traffic:
- Move PostgreSQL to a managed database (Supabase, Neon, or RDS)
- Move Redis to managed Redis (Upstash, ElastiCache)
- Use Cloudflare R2 or Backblaze B2 instead of MinIO
- Dokploy supports multi-server clusters for horizontal scaling

---

## Troubleshooting

**Build fails**: Check Dokploy build logs. Common issues:
- Out of memory during build → increase VPS RAM or add swap
- Docker cache issues → clear Docker build cache in Dokploy settings

**API won't start**: Check container logs for the `api` service:
- `DATABASE_URL is required` → ensure env vars are set
- `JWT_SECRET is required` → add JWT_SECRET to environment
- Connection refused to postgres → ensure postgres healthcheck passes first

**CORS errors**: Ensure `CORS_ORIGINS` includes your web and admin domains (the docker-compose.prod.yml handles this automatically via `WEB_URL` and `ADMIN_URL`).

**422 VALIDATION_ERROR with `unexpected EOF` on POST/PUT**:
- Usually means request body was consumed by middleware before JSON binding.
- Verify WAF bypass body-buffer prefixes match real route paths (for example `/api/pages`, `/api/posts`, `/api/email/...`).
- After route changes, update middleware prefix lists and redeploy API.

**SSL not working**: Ensure DNS A records point to your VPS IP and ports 80/443 are open.
