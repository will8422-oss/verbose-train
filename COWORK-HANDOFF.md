# Cowork Handoff: Kindle Reading List Setup

This document is optimized for Claude Cowork to complete the Kindle sync setup.

## Context

This is a Next.js reading list app that syncs with the user's Kindle account. The code is built and tested (MVP 1 and 2 complete). What remains is **operational setup** - deploying a TLS proxy and configuring credentials.

## Your Task

Complete these setup steps so the Kindle sync pipeline works:

1. Deploy TLS proxy server (Fly.io recommended)
2. Extract Amazon cookies from user's browser
3. Get device token from Amazon
4. Create `.env.local` with credentials
5. Test the sync locally
6. Add GitHub secrets for automated daily sync
7. Verify GitHub Action runs successfully

---

## Step 1: Deploy TLS Proxy to Fly.io

The kindle-api library needs a TLS proxy because Amazon fingerprints connections.

### Commands to run:

```bash
# Install Fly CLI if not present
curl -L https://fly.io/install.sh | sh

# Clone the TLS proxy repo
cd /tmp
git clone https://github.com/bogdanfinn/tls-client-api
cd tls-client-api

# Create Fly app (interactive - follow prompts)
fly launch --no-deploy

# Generate API key and set as secret
API_KEY=$(openssl rand -hex 32)
echo "Generated API key: $API_KEY"
fly secrets set AUTH_KEYS="$API_KEY"

# Deploy
fly deploy

# Get the app URL
fly status
```

### Expected output:
- A running Fly.io app
- URL like `https://your-app-name.fly.dev`
- API key stored

### Checkpoint:
```bash
curl https://your-app-name.fly.dev/api/health
# Should return 200 OK
```

### Save these values:
- `KINDLE_TLS_SERVER_URL`: The Fly.io URL
- `KINDLE_TLS_SERVER_API_KEY`: The generated API key

---

## Step 2: Extract Amazon Cookies

The user needs to be logged into Amazon for this step.

### Instructions for user:
1. Open browser to https://read.amazon.com
2. Log in if needed
3. Open DevTools (F12)
4. Go to Application tab → Cookies → read.amazon.com
5. Find and copy values for:
   - `ubid-main`
   - `at-main`
   - `x-main`
   - `session-id`

### Format the cookie string:
```
ubid-main=VALUE1; at-main=VALUE2; x-main=VALUE3; session-id=VALUE4
```

### Save as:
- `KINDLE_COOKIES`: The formatted cookie string

---

## Step 3: Get Device Token

Still in DevTools on read.amazon.com:

1. Go to Network tab
2. Reload the page (F5)
3. Filter for "getDeviceToken"
4. Find request URL like:
   ```
   https://read.amazon.com/service/web/register/getDeviceToken?serialNumber=XXXXX&deviceType=XXXXX
   ```
5. Copy the `serialNumber` value

### Save as:
- `KINDLE_DEVICE_TOKEN`: The serialNumber value

---

## Step 4: Create Local Environment File

Navigate to the project directory and create `.env.local`:

```bash
cd /path/to/verbose-train

cat > .env.local << 'EOF'
KINDLE_COOKIES="ubid-main=...; at-main=...; x-main=...; session-id=..."
KINDLE_DEVICE_TOKEN="..."
KINDLE_TLS_SERVER_URL="https://your-app.fly.dev"
KINDLE_TLS_SERVER_API_KEY="..."
EOF
```

Replace the placeholder values with actual credentials from previous steps.

---

## Step 5: Test Sync Locally

```bash
cd /path/to/verbose-train
npm install  # if not done
npm run kindle:sync
```

### Expected output:
```
Kindle sync starting...
Connected. Fetching library...
Fetched N books from Kindle.

Sync complete:
  Books added:     N
  Books updated:   0
  Entries created: N
  Entries updated: 0
  Skipped:         0
```

### Troubleshooting:

| Error | Fix |
|-------|-----|
| `Missing environment variables` | Check `.env.local` has all 4 values |
| `Kindle authentication failed` | Re-extract cookies from browser |
| `ECONNREFUSED` | TLS server not running - check `fly status` |
| `401 Unauthorized` | API key mismatch - verify `AUTH_KEYS` on Fly matches local |

### Checkpoint:
```bash
cat data/books.json | head -20
# Should show book data from Kindle
```

---

## Step 6: Add GitHub Secrets

Go to the GitHub repo's Settings → Secrets and variables → Actions.

Add these 4 repository secrets:

| Secret Name | Value |
|-------------|-------|
| `KINDLE_COOKIES` | Cookie string from Step 2 |
| `KINDLE_DEVICE_TOKEN` | Token from Step 3 |
| `KINDLE_TLS_SERVER_URL` | Fly.io URL from Step 1 |
| `KINDLE_TLS_SERVER_API_KEY` | API key from Step 1 |

### Via GitHub CLI (alternative):
```bash
gh secret set KINDLE_COOKIES --body "..."
gh secret set KINDLE_DEVICE_TOKEN --body "..."
gh secret set KINDLE_TLS_SERVER_URL --body "https://your-app.fly.dev"
gh secret set KINDLE_TLS_SERVER_API_KEY --body "..."
```

---

## Step 7: Test GitHub Action

1. Go to repo → Actions tab
2. Click "Sync Kindle Library" workflow
3. Click "Run workflow" button
4. Watch the logs

### Expected result:
- Workflow completes with green checkmark
- If books changed, a commit appears: "Sync Kindle library [automated]"
- `data/books.json` and `data/reading.json` updated

---

## Completion Checklist

- [ ] TLS proxy deployed and healthy
- [ ] Cookies extracted (4 values)
- [ ] Device token obtained
- [ ] `.env.local` created with all credentials
- [ ] Local sync test passed (`npm run kindle:sync`)
- [ ] GitHub secrets added (4 secrets)
- [ ] GitHub Action test passed

## What's Next

Once setup is complete, the daily sync runs automatically at 6am UTC. The user can continue development (MVP 3-5) in Claude Code:

- MVP 3: Open Library metadata enrichment + reading lists
- MVP 4: Suggestions engine + Goodreads import
- MVP 5: Frontend UI matching willruns.co design
- Integration: Merge into main site

See `PROJECT.md` for full roadmap details.
