# Kindle Sync Setup Guide

Step-by-step setup for connecting your Kindle account to the sync pipeline.

## Overview

Four things to configure:

1. **Amazon cookies** (4 values from your browser)
2. **Device token** (1 value from your browser)
3. **TLS proxy server** (self-hosted Go service)
4. **GitHub secrets** (for the automated daily sync)

Estimated time: 20-30 minutes.

---

## Step 1: Get Amazon Cookies

1. Go to [read.amazon.com](https://read.amazon.com) and log in
2. Open DevTools (F12 or right-click > Inspect)
3. Go to **Application** tab > **Cookies** > `https://read.amazon.com`
4. Copy the values for these four cookies:
   - `ubid-main`
   - `at-main`
   - `x-main`
   - `session-id`
5. Format them as a single string:
   ```
   ubid-main=VALUE; at-main=VALUE; x-main=VALUE; session-id=VALUE
   ```

These cookies are valid for ~1 year.

---

## Step 2: Get Device Token

1. Still on read.amazon.com, open DevTools > **Network** tab
2. Reload the page
3. Find a request to `getDeviceToken` in the network list
4. The URL looks like:
   ```
   https://read.amazon.com/service/web/register/getDeviceToken?serialNumber=XXXX&deviceType=XXXX
   ```
5. Copy the `serialNumber` value (same as `deviceType`)

---

## Step 3: Deploy the TLS Proxy Server

Amazon fingerprints TLS connections, so requests need to go through [tls-client-api](https://github.com/bogdanfinn/tls-client-api) (a Go service).

### Option A: Fly.io (Free tier, recommended)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Clone the repo
git clone https://github.com/bogdanfinn/tls-client-api
cd tls-client-api

# Create fly app
fly launch --no-deploy

# Set API key (generate a random string)
fly secrets set AUTH_KEYS="$(openssl rand -hex 32)"

# Deploy
fly deploy

# Get your URL
fly status
# URL will be like: https://your-app.fly.dev
```

### Option B: Docker on any VPS

```bash
# Pull and run
docker run -d \
  --name tls-client-api \
  -p 8080:8080 \
  -e AUTH_KEYS="your-secret-key-here" \
  ghcr.io/bogdanfinn/tls-client-api:latest

# Or build from source
git clone https://github.com/bogdanfinn/tls-client-api
cd tls-client-api
docker build -t tls-client-api .
docker run -d -p 8080:8080 -e AUTH_KEYS="your-secret" tls-client-api
```

### Option C: Railway / Render (cloud deploy)

1. Fork [tls-client-api](https://github.com/bogdanfinn/tls-client-api)
2. Connect to Railway or Render
3. Deploy from Dockerfile
4. Set env var `AUTH_KEYS` to a random secret

### Generate an API Key

```bash
openssl rand -hex 32
# Copy the output - this is your KINDLE_TLS_SERVER_API_KEY
```

### Verify It's Running

```bash
curl https://your-tls-server-url/api/health
# Should return 200 OK
```

---

## Step 4: Set Up Local Environment

Create `.env.local` in the project root:

```env
KINDLE_COOKIES="ubid-main=...; at-main=...; x-main=...; session-id=..."
KINDLE_DEVICE_TOKEN="your-device-token"
KINDLE_TLS_SERVER_URL="https://your-tls-server.fly.dev"
KINDLE_TLS_SERVER_API_KEY="your-generated-key"
```

### Test the Sync Locally

```bash
npm run kindle:sync
```

Expected output:
```
Kindle sync starting...
Connected. Fetching library...
Fetched 47 books from Kindle.

Sync complete:
  Books added:     47
  Books updated:   0
  Entries created: 47
  Entries updated: 0
  Skipped:         0
```

### Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `KindleAuthError: Missing env vars` | Env not loaded | Check `.env.local` exists and values set |
| `Kindle authentication failed` | Cookies expired/wrong | Re-grab cookies from browser |
| `ECONNREFUSED` on TLS server | TLS server down | Check health endpoint, restart service |
| `401 Unauthorized` on TLS server | Wrong API key | Verify `KINDLE_TLS_SERVER_API_KEY` matches server's `AUTH_KEYS` |

---

## Step 5: Add GitHub Secrets

For the automated daily sync:

1. Go to your repo on GitHub
2. **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** for each:

| Name | Value |
|------|-------|
| `KINDLE_COOKIES` | Your cookie string from Step 1 |
| `KINDLE_DEVICE_TOKEN` | Device token from Step 2 |
| `KINDLE_TLS_SERVER_URL` | URL from Step 3 |
| `KINDLE_TLS_SERVER_API_KEY` | API key from Step 3 |

### Test the GitHub Action

1. Go to **Actions** tab
2. Click **Sync Kindle Library**
3. Click **Run workflow** button
4. Watch the logs

If it succeeds, you'll see a commit like "Sync Kindle library [automated]" and data files updated.

---

## Maintenance

### Cookie Refresh

Cookies last ~1 year but can break sooner if Amazon invalidates them.

**When it breaks:** GitHub Action fails with exit code 77 and a clear error.

**To fix:** Re-do Step 1 and update the `KINDLE_COOKIES` secret.

### Monitoring

- **View sync history:** Actions tab in GitHub
- **Manual sync:** Actions > Sync Kindle Library > Run workflow
- **Local debug:** `npm run kindle:sync` with verbose logs

---

## Cost Summary

| Service | Cost |
|---------|------|
| GitHub Actions (private repo) | Free (2000 min/month, this uses ~60/month) |
| Fly.io TLS server | Free tier |
| Vercel (Next.js hosting) | Free |
| **Total** | **$0/month** |

Upgrade paths if needed:
- Fly.io paid tier: $5/mo for always-on VM
- DigitalOcean droplet: $4/mo
