# Keep-Alive Cron Job Setup Guide

## What This Does
Automatically pings your CLIP API every 24 hours to prevent it from going to sleep.

## Your Keep-Alive Endpoint
```
https://your-domain.com/api/keep-alive
```

## Setup Options

### Option 1: cron-job.org (Recommended - Free & Easy)

1. **Go to:** https://cron-job.org/en/
2. **Sign up** for a free account
3. **Create New Cron Job:**
   - **Title:** Cakeland CLIP Keep-Alive
   - **URL:** `https://your-domain.com/api/keep-alive`
   - **Schedule:** Every day at 12:00 PM (or any time)
   - **Execution:** Every 1 day
4. **Save & Enable**

✅ **Done!** Your CLIP API will stay awake.

---

### Option 2: EasyCron (Free Tier Available)

1. **Go to:** https://www.easycron.com/
2. **Sign up** for free account
3. **Add Cron Job:**
   - **URL:** `https://your-domain.com/api/keep-alive`
   - **Cron Expression:** `0 12 * * *` (daily at noon)
4. **Save**

---

### Option 3: GitHub Actions (Free for Public Repos)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep CLIP API Awake

on:
  schedule:
    # Runs every day at 12:00 PM UTC
    - cron: '0 12 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Keep-Alive Endpoint
        run: |
          curl -f https://your-domain.com/api/keep-alive || exit 1
```

**Commit this file to your repo** and GitHub will run it automatically.

---

### Option 4: Vercel Cron Jobs (If deployed on Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/keep-alive",
      "schedule": "0 12 * * *"
    }
  ]
}
```

Then redeploy: `vercel --prod`

---

## Testing Your Setup

### Test the endpoint manually:

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/keep-alive"
```

**Or in browser:**
```
http://localhost:3000/api/keep-alive
```

**Expected response:**
```json
{
  "success": true,
  "message": "CLIP API is awake and responsive",
  "responseTime": "1234ms",
  "timestamp": "2026-01-20T14:42:33.000Z"
}
```

---

## Monitoring

### Check if cron job is working:

1. **View cron job logs** on your chosen service
2. **Check your Next.js logs** for:
   ```
   [Keep-Alive] ✅ Success! CLIP API responded in XXXms
   ```

### If it fails:

- Check that your domain is correct
- Verify the endpoint is accessible publicly
- Check Hugging Face Space status

---

## Recommended Schedule

**Best practice:** Run every 24 hours

- ✅ `0 12 * * *` - Daily at noon
- ✅ `0 0 * * *` - Daily at midnight
- ❌ Don't run more frequently (wastes resources)
- ❌ Don't run less than every 48 hours (Space will sleep)

---

## Troubleshooting

### "Connection refused"
- Your site isn't deployed yet, or URL is wrong
- Test locally first: `http://localhost:3000/api/keep-alive`

### "503 Service Unavailable"
- CLIP API is down or sleeping
- Wait 60 seconds and try again
- Check: https://rachit1105-clip-embedding-api.hf.space

### "Timeout"
- CLIP API is waking up (first time after sleep)
- This is normal - next ping will be fast

---

## Quick Start (Fastest Method)

1. Deploy your site (Vercel/Netlify/etc.)
2. Go to https://cron-job.org
3. Create account
4. Add cron job with your site URL + `/api/keep-alive`
5. Set to run daily
6. ✅ Done!

**Time to setup: ~3 minutes**
