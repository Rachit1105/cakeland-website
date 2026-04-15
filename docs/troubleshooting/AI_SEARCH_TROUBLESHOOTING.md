# AI Search Troubleshooting Guide

## Problem: Search Keeps Buffering After Inactivity

### Root Cause
Your AI search relies on a **Hugging Face Space** hosted at:
```
https://rachit1105-clip-embedding-api.hf.space
```

**Free-tier Hugging Face Spaces automatically go to sleep after ~48 hours of inactivity.**

When a Space is asleep:
- The first request takes **30-60 seconds** to wake it up
- During this time, your search appears to "buffer" or hang
- The CLIP model needs to load into memory before it can process requests

### Solution Applied

I've added **timeout handling** and **user-friendly error messages**:

#### 1. Backend Changes (`app/api/search/route.ts`)
- Added 60-second timeout to CLIP API calls
- Returns a `503 Service Unavailable` status with helpful message when timeout occurs
- Error message: "The AI search service was sleeping and is now waking up. Please try again in 30 seconds."

#### 2. Frontend Changes (`app/explore/page.tsx`)
- Detects the 503 status code
- Shows user-friendly alert explaining the situation
- Falls back to showing all products while AI wakes up

### How to Use

**When search is buffering:**
1. Wait for the alert message
2. Wait 30-60 seconds
3. Try your search again - it should work instantly now

**The Space will stay awake as long as:**
- Someone uses search at least once every ~48 hours
- You keep the Space active

### Long-term Solutions

#### Option 1: Upgrade to Hugging Face Pro ($9/month)
- Spaces never sleep
- Faster hardware
- More reliable

#### Option 2: Keep-Alive Script
Create a cron job that pings your API every 24 hours:
```bash
curl -X POST https://your-site.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
```

#### Option 3: Self-Host the CLIP Model
- Deploy the CLIP API to your own server
- More control, but requires infrastructure
- Consider using Railway, Render, or similar platforms

#### Option 4: Use a Different AI Service
- OpenAI CLIP API (paid)
- Replicate (pay-per-use)
- AWS SageMaker / Google Vertex AI

### Testing the Fix

1. **Test the timeout:**
   - Don't use search for 2 days
   - Try searching - you should see the friendly alert
   - Wait 30 seconds and try again - should work

2. **Check logs:**
   - Open browser DevTools → Console
   - You'll see: "CLIP API timeout - Space may be waking up from sleep"

### Monitoring

Check if your HF Space is awake:
```bash
curl https://rachit1105-clip-embedding-api.hf.space/health
```

If it returns quickly → Space is awake ✅  
If it times out → Space is sleeping 😴

---

**Last Updated:** 2026-01-20  
**Status:** ✅ Timeout handling implemented
