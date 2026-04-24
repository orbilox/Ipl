# Deployment Guide — Railway (DB) + Vercel (App)

## Architecture
```
Vercel  ──────────────────►  Next.js App (frontend + API)
                                    │
                                    ▼
Railway PostgreSQL  ◄──────  Prisma ORM (DATABASE_URL)
```

---

## Step 1 — Railway: Create PostgreSQL Database

1. Go to [railway.app](https://railway.app) → **New Project** → **Provision PostgreSQL**
2. Click the Postgres service → **Variables** tab
3. Copy these two values:
   - `DATABASE_URL` (pooled connection string)
   - `DATABASE_PUBLIC_URL` (direct connection string — will be used as `DIRECT_URL`)

---

## Step 2 — Vercel: Deploy the App

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `orbilox/ipl` from GitHub
2. Select branch: `claude/ipl-trading-platform-1xE1Q`
3. In **Environment Variables**, add all of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Paste Railway `DATABASE_URL` |
| `DIRECT_URL` | Paste Railway `DATABASE_PUBLIC_URL` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` (fill in after first deploy) |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `CRICKET_API_KEY` | Your [CricAPI](https://cricapi.com) key (free tier available) |
| `CRICKET_API_BASE` | `https://api.cricapi.com/v1` |
| `RAZORPAY_KEY_ID` | Your Razorpay key (test mode ok) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret |
| `APP_URL` | `https://your-app.vercel.app` |

4. Click **Deploy**. Vercel will run `npm install` → `postinstall` (prisma generate) → `next build`.

---

## Step 3 — Run Database Migrations

After the first deploy, run migrations from the Vercel terminal or locally:

```bash
# Option A: run from local machine with Railway DB URL
DATABASE_URL="<railway-pooled-url>" DIRECT_URL="<railway-direct-url>" npx prisma migrate deploy

# Option B: use Railway CLI
railway login
railway link          # select your project
railway run npx prisma migrate deploy
```

---

## Step 4 — Seed the Database (optional)

```bash
# Locally pointing at Railway DB:
DATABASE_URL="<railway-url>" DIRECT_URL="<railway-direct-url>" npm run db:seed

# Or via Railway CLI:
railway run npm run db:seed
```

This creates:
- Admin: `admin@ipltrading.com` / `Admin@123456`
- 5 demo users with balances
- 6 IPL matches (1 live, 2 upcoming, 1 completed)
- 30 IPL players
- Fantasy contests for each match

---

## Step 5 — Fix NEXTAUTH_URL

After Vercel assigns your URL (e.g. `https://ipl-trading-platform.vercel.app`):

1. Go to Vercel → Project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` and `APP_URL` to your actual URL
3. Redeploy (Vercel → Deployments → Redeploy)

---

## Custom Domain (optional)

Vercel: Settings → Domains → Add your domain → update DNS

---

## Production Checklist

- [ ] `NEXTAUTH_SECRET` is a strong random value (not the example)
- [ ] `NEXTAUTH_URL` matches the actual deployed URL exactly
- [ ] Razorpay set to **live mode** keys for real payments
- [ ] CricAPI key has sufficient quota for your traffic
- [ ] Railway PostgreSQL plan has enough storage
- [ ] Ran `prisma migrate deploy` against production DB
- [ ] Seeded admin account and changed default password

---

## Updating the App

Push to the `claude/ipl-trading-platform-1xE1Q` branch → Vercel auto-deploys.

For schema changes:
```bash
# Create new migration
npx prisma migrate dev --name your_change_name

# Deploy to production
railway run npx prisma migrate deploy
```
