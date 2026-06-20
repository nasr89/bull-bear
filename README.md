# Bull & Bear Trading Community — Sales Platform

A full-stack CRM and sales platform for Bull & Bear Trading Community, Lebanon.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT access token (15m) + httpOnly refresh token (7d, rotated) |
| Infra | Docker + docker-compose |
| CI/CD | GitHub Actions → GHCR → SSH deploy |

## Roles & Permissions

| Permission | USER | ADMIN | SUPERADMIN |
|-----------|------|-------|-----------|
| View own leads | ✅ | ✅ | ✅ |
| View all leads | ❌ | ✅ | ✅ |
| Create/edit leads | ✅ | ✅ | ✅ |
| Delete leads | ❌ | ✅ | ✅ |
| Create users (USER role) | ❌ | ✅ | ✅ |
| Create ADMIN accounts | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/bull-bear.git
cd bull-bear

# 2. Create env file
cp backend/.env.example backend/.env
# Edit backend/.env with your secrets!

# 3. Start everything
docker compose up -d

# 4. Seed the database
docker compose exec backend npm run db:seed

# 5. Open the app
open http://localhost:3000
```

## Default Credentials (after seed)

| Role | Email | Password |
|------|-------|---------|
| Superadmin | superadmin@bullandbear.lb | SuperAdmin@123 |
| Admin | admin@bullandbear.lb | Admin@123 |
| User | user@bullandbear.lb | User@123 |

> ⚠️ **Change all passwords immediately in production!**

## Local Development (without Docker)

### Prerequisites
- Node.js 22+
- PostgreSQL 16
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets

npx prisma migrate dev --name init
npm run db:seed
npm run dev
# Runs on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000

npm run dev
# Runs on http://localhost:3000
```

## API Endpoints

### Auth
| Method | Path | Access |
|--------|------|--------|
| POST | /api/auth/login | Public |
| POST | /api/auth/refresh | Public (cookie) |
| POST | /api/auth/logout | Public |
| GET | /api/auth/me | Authenticated |

### Users
| Method | Path | Access |
|--------|------|--------|
| GET | /api/users | ADMIN, SUPERADMIN |
| GET | /api/users/:id | ADMIN, SUPERADMIN |
| POST | /api/users | ADMIN, SUPERADMIN |
| PUT | /api/users/:id | ADMIN, SUPERADMIN |
| DELETE | /api/users/:id | SUPERADMIN only |

### Leads
| Method | Path | Access |
|--------|------|--------|
| GET | /api/leads | Authenticated (filtered by role) |
| GET | /api/leads/:id | Authenticated |
| POST | /api/leads | Authenticated |
| PUT | /api/leads/:id | Authenticated |
| DELETE | /api/leads/:id | ADMIN, SUPERADMIN |

## Deploy to Production (GitHub Actions)

1. Add these **Secrets** to your GitHub repo (`Settings → Secrets`):
   - `JWT_ACCESS_SECRET` — random 64-char string
   - `JWT_REFRESH_SECRET` — random 64-char string
   - `DEPLOY_HOST` — your server IP
   - `DEPLOY_USER` — SSH username (e.g. `ubuntu`)
   - `DEPLOY_KEY` — your SSH private key

2. Add these **Variables**:
   - `CLIENT_URL` — e.g. `https://app.bullandbear.lb`
   - `NEXT_PUBLIC_API_URL` — e.g. `https://api.bullandbear.lb`

3. Push to `main` — GitHub Actions will build, push images to GHCR, and deploy via SSH.

## Project Structure

```
bull-bear/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database models
│   │   └── seed.js            # Default users
│   └── src/
│       ├── config/            # Prisma client
│       ├── controllers/       # Business logic
│       ├── middleware/        # Auth, error handling
│       ├── routes/            # Express routes
│       └── utils/             # JWT helpers
├── frontend/
│   └── src/
│       ├── app/               # Next.js App Router pages
│       ├── components/        # Shared UI components
│       ├── context/           # Auth context
│       └── lib/               # Axios client
├── .github/workflows/         # CI/CD pipeline
├── docker-compose.yml
└── README.md
```

## Security Notes

- Access tokens stored in memory only (never localStorage)
- Refresh tokens in httpOnly, SameSite=Strict cookies
- Refresh token rotation on every use
- Bcrypt with 12 rounds
- Rate limiting on auth endpoints (10 req/15min)
- Helmet.js security headers
- Input validation with express-validator
- Audit logging for all user management actions
