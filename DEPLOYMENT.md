# Ceremony Expense Tracker - Deployment Guide

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Angular Frontend  │────▶│   Node.js Backend   │────▶│   MySQL Database    │
│   (Vercel - Free)   │     │   (Render - Free)   │     │ (TiDB Cloud - Free) │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Step 1: Set Up MySQL Database (TiDB Cloud)

TiDB Cloud offers a **free serverless MySQL-compatible database** with:
- 5GB storage
- 50 million Request Units/month
- No credit card required

### Create TiDB Cloud Account

1. Go to https://tidbcloud.com/
2. Sign up with Google/GitHub/Email
3. Create a new **Serverless** cluster (free)
4. Choose region closest to you (e.g., Singapore)
5. Wait for cluster to be created (~2 minutes)

### Get Connection String

1. Click on your cluster → **Connect**
2. Select **General** connection type
3. Choose **MySQL CLI** to see credentials
4. Copy the connection string, format:

```
mysql://USERNAME:PASSWORD@gateway01.REGION.prod.aws.tidbcloud.com:4000/DATABASE?ssl={"rejectUnauthorized":true}
```

**Important:** URL-encode special characters in password:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`
- etc.

---

## Step 2: Deploy Backend (Render)

Render offers a **free web service** with:
- 750 hours/month (enough for full month)
- Auto-deploy from Git
- HTTPS included

### Deploy to Render

1. Push code to GitHub/GitLab
2. Go to https://dashboard.render.com/
3. Click **New** → **Web Service**
4. Connect your repository
5. Configure:
   - **Name:** ceremony-tracker-api
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** `npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Set Environment Variables

In Render dashboard, add these environment variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your TiDB connection string |
| `JWT_SECRET` | A random secure string (32+ characters) |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after frontend deploy) |
| `NODE_ENV` | `production` |

### Initialize Database

After deploying, run the seed script using Render Shell:
1. Go to your service → **Shell**
2. Run: `npx ts-node prisma/seed.ts`

Or connect to database directly and run migrations:
```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

---

## Step 3: Deploy Frontend (Vercel)

Vercel offers **unlimited free hosting** for personal projects:
- Automatic HTTPS
- Global CDN
- Auto-deploy from Git

### Deploy to Vercel

1. Go to https://vercel.com/
2. Sign up with GitHub
3. Click **Add New** → **Project**
4. Import your repository
5. Configure:
   - **Framework Preset:** Angular
   - **Root Directory:** `./` (leave as root)
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `dist/ceremony-expense-tracker/browser`

### Update Environment

Before deploying, update [src/environments/environment.prod.ts](src/environments/environment.prod.ts):

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api.onrender.com/api'  // Your Render URL
};
```

### Update CORS

After getting Vercel URL, update Render environment:
- `FRONTEND_URL` = `https://your-app.vercel.app`

---

## Step 4: Test the Deployment

1. Visit your Vercel URL
2. Login with default credentials:
   - **Admin:** admin@ceremony.app / admin123
   - **Brothers:** hnk@ceremony.app, hnp@ceremony.app, etc. / brother123
   - **Contributors:** hnu@ceremony.app / contributor123

---

## Local Development

### Run Backend Locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your TiDB connection string
npm run prisma:generate
npm run prisma:push
npx ts-node prisma/seed.ts
npm run dev
```

Backend runs at: http://localhost:3000

### Run Frontend Locally

```bash
npm install
npm start
```

Frontend runs at: http://localhost:4200

---

## Free Tier Limits

| Service | Limit | Notes |
|---------|-------|-------|
| **TiDB Cloud** | 5GB storage, 50M RU/month | More than enough for this app |
| **Render** | 750 hours/month | Spins down after 15 min inactivity |
| **Vercel** | Unlimited | Personal projects only |

### Render Cold Starts

The free Render tier spins down after 15 minutes of inactivity. First request after idle may take 30-60 seconds. This is acceptable for a small family app.

---

## Security Notes

1. **Change default passwords** after first login
2. **JWT_SECRET** should be a random 32+ character string
3. TiDB Cloud uses **SSL by default** - data is encrypted in transit
4. **Never commit `.env` files** to version control

---

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL format
- Ensure special characters in password are URL-encoded
- Verify TiDB cluster is running

### "CORS error"
- Update FRONTEND_URL in Render environment
- Restart Render service after changing environment variables

### "Login fails"
- Run seed script to create default users
- Check browser console for error details

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| TiDB Cloud Serverless | **$0** |
| Render Free Tier | **$0** |
| Vercel Free Tier | **$0** |
| **Total** | **$0** |

Your ceremony expense tracker is completely free to run! 🎉
