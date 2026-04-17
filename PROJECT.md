# Kindle Reading List

A reading list feature for [willruns.co](https://www.willruns.co/) that syncs with Kindle, tracks books, and surfaces reading data on the personal website.

## Context & Key Decisions

### Target Site: willruns.co
- **Stack:** Next.js 14 (App Router), deployed on Vercel
- **Design:** Dark theme (`bg-black`/`bg-gray-900`), white text, card-based layout
- **Existing sections:** Marathon training, Strava stats, Recovery metrics, Blog
- **New section:** Reading - fits alongside existing personal dashboard cards

### Why JSON in Repo (not external DB)
- Vercel serverless can't persist filesystem writes
- JSON files are version controlled (history of reading over time)
- Simple to edit manually if needed
- Sync happens via GitHub Action → commit → auto-deploy
- Can migrate to external DB later if needed

### Why GitHub Actions for Sync
- Free cron scheduling (no server needed)
- Runs on GitHub's infrastructure
- Commits directly to repo, triggers Vercel deploy
- Easy to monitor and manually trigger
- Secrets management built in

### Why Two Models (Book vs ReadingEntry)
- **Book:** Metadata that's the same for everyone (title, author, pages)
- **ReadingEntry:** Your personal data (status, rating, notes, progress)
- Allows same book to be re-read, or shared book data if expanded later

### Data Source Priority
1. **Kindle** (primary) - Auto-synced daily, includes reading progress
2. **Manual entry** - For non-Kindle books
3. **Goodreads import** - One-time migration of historical data
4. **Open Library** - Enriches metadata (genres, descriptions, page counts)

## Features

- **Kindle Sync** - Pull library and reading progress from Kindle account
- **Book Tracking** - Status (reading/finished/want-to-read), ratings, notes
- **Reading Lists** - Curated collections (e.g., "2024 Favorites", "Sci-Fi")
- **Suggestions** - Recommendations based on genres and authors you enjoy
- **Import/Export** - Goodreads CSV import, JSON backup

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data Storage | JSON files (in repo) |
| Automated Sync | GitHub Actions (cron) |
| Primary Data Source | [kindle-api](https://github.com/Xetera/kindle-api) |
| Metadata Enrichment | Open Library API |
| Backup Import | Goodreads CSV |

## MVP Roadmap

### MVP 1: Core Data Layer
**Goal:** Basic book storage and CRUD operations

- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] TypeScript types/interfaces
- [ ] JSON storage helpers
- [ ] Book CRUD API routes (`/api/reading/books`)
- [ ] Reading entry CRUD API routes (`/api/reading/entries`)

**Test commands:**
```bash
# List all books
curl http://localhost:3000/api/reading/books

# Add a book
curl -X POST http://localhost:3000/api/reading/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Dune","authors":["Frank Herbert"],"genres":["sci-fi"]}'

# Update book
curl -X PUT http://localhost:3000/api/reading/books/[id] \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"status":"finished"}'

# Delete book
curl -X DELETE http://localhost:3000/api/reading/books/[id]
```

### MVP 2: Kindle Integration
**Goal:** Sync books from Kindle account

- [ ] Install and configure kindle-api
- [ ] Kindle auth (cookie-based)
- [ ] Sync script (`scripts/kindle-sync.ts`)
- [ ] Merge logic (Kindle data + local data)
- [ ] GitHub Action for automated daily sync

**Test commands:**
```bash
# Run sync locally
KINDLE_COOKIES='{"session-id":"..."}' npx tsx scripts/kindle-sync.ts

# Verify data files updated
cat data/books.json | jq '.[] | .title'

# Test Action locally with act (optional)
act -j sync --secret-file .secrets
```

### MVP 3: Metadata & Lists
**Goal:** Enrich book data, create reading lists

- [ ] Open Library API client
- [ ] Auto-fetch genres, page counts, descriptions
- [ ] Reading lists CRUD (`/api/reading/lists`)
- [ ] Add/remove books from lists

**Test commands:**
```bash
# Search Open Library
curl "http://localhost:3000/api/reading/search?q=dune"

# Create a list
curl -X POST http://localhost:3000/api/reading/lists \
  -H "Content-Type: application/json" \
  -d '{"name":"2024 Favorites","bookIds":["id1","id2"]}'

# Verify metadata enrichment
curl http://localhost:3000/api/reading/books/[id] | jq '.genres, .pageCount'
```

### MVP 4: Suggestions & Import
**Goal:** Smart recommendations, data import

- [ ] Suggestions engine (genre/author based)
- [ ] Goodreads CSV parser
- [ ] Import endpoint (`/api/reading/import`)

**Test commands:**
```bash
# Get suggestions
curl http://localhost:3000/api/reading/suggestions

# Import Goodreads CSV
curl -X POST http://localhost:3000/api/reading/import \
  -F "file=@goodreads_library_export.csv" \
  -F "source=goodreads"

# Verify import (check for duplicates handled)
curl http://localhost:3000/api/reading/books | jq 'length'
```

### MVP 5: Frontend UI
**Goal:** Pages that match willruns.co design

- [ ] `/reading` - Dashboard (currently reading, recent)
- [ ] `/reading/library` - Full library with filters
- [ ] `/reading/lists` - All reading lists
- [ ] `/reading/lists/[id]` - Single list view
- [ ] Homepage card component

**Test checklist:**
- [ ] Dashboard shows currently reading book with progress
- [ ] Library filters by status, genre, rating
- [ ] Book cards display cover, title, author, progress
- [ ] Lists can be created, edited, deleted
- [ ] Responsive on mobile
- [ ] Dark theme matches willruns.co
- [ ] Homepage card shows current book + yearly count

### Integration
**Goal:** Merge into willruns.co

- [ ] Copy files to main site repo
- [ ] Add "Reading" card to homepage
- [ ] Configure Kindle auth in production
- [ ] Deploy and verify

## Data Models

### Book
```typescript
interface Book {
  id: string
  title: string
  authors: string[]
  isbn?: string
  asin?: string                    // Amazon ID (from Kindle)
  coverUrl?: string
  pageCount?: number
  genres: string[]
  description?: string
  openLibraryId?: string
  createdAt: string
  updatedAt: string
}
```

### ReadingEntry
```typescript
interface ReadingEntry {
  id: string
  bookId: string
  status: 'want-to-read' | 'reading' | 'finished' | 'abandoned'
  rating?: number                  // 1-5
  progress?: number                // 0-100 (from Kindle)
  startDate?: string
  finishDate?: string
  notes?: string
  favorite: boolean
  kindleLastSynced?: string
  createdAt: string
  updatedAt: string
}
```

### ReadingList
```typescript
interface ReadingList {
  id: string
  name: string
  description?: string
  bookIds: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
```

## File Structure

```
.github/
└── workflows/
    └── kindle-sync.yml            # Automated daily Kindle sync

scripts/
└── kindle-sync.ts                 # CLI script for syncing Kindle

app/
├── reading/
│   ├── page.tsx                   # Dashboard
│   ├── library/
│   │   └── page.tsx               # Full library
│   └── lists/
│       ├── page.tsx               # All lists
│       └── [id]/
│           └── page.tsx           # Single list
├── api/
│   └── reading/
│       ├── books/
│       │   ├── route.ts           # GET all, POST new
│       │   └── [id]/
│       │       └── route.ts       # GET, PUT, DELETE one
│       ├── lists/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── kindle/
│       │   └── sync/
│       │       └── route.ts       # Trigger Kindle sync
│       ├── import/
│       │   └── route.ts           # Goodreads import
│       └── search/
│           └── route.ts           # Open Library search

components/
└── reading/
    ├── BookCard.tsx
    ├── BookGrid.tsx
    ├── CurrentlyReading.tsx
    ├── ReadingListCard.tsx
    ├── ReadingStats.tsx
    ├── BookSearch.tsx
    └── KindleSyncButton.tsx

lib/
├── reading/
│   ├── storage.ts                 # JSON file read/write
│   ├── kindle.ts                  # Kindle API wrapper
│   ├── openLibrary.ts             # Open Library client
│   ├── suggestions.ts             # Recommendation logic
│   └── importers/
│       └── goodreads.ts           # CSV parser

data/
├── books.json                     # Book metadata
├── reading.json                   # Reading entries
└── lists.json                     # Reading lists

types/
└── reading.ts                     # TypeScript interfaces
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reading/books` | List all books |
| POST | `/api/reading/books` | Add a book |
| GET | `/api/reading/books/[id]` | Get single book |
| PUT | `/api/reading/books/[id]` | Update book |
| DELETE | `/api/reading/books/[id]` | Delete book |
| GET | `/api/reading/lists` | List all reading lists |
| POST | `/api/reading/lists` | Create a list |
| GET | `/api/reading/lists/[id]` | Get single list |
| PUT | `/api/reading/lists/[id]` | Update list |
| DELETE | `/api/reading/lists/[id]` | Delete list |
| POST | `/api/reading/kindle/sync` | Sync from Kindle |
| POST | `/api/reading/import` | Import Goodreads CSV |
| GET | `/api/reading/search?q=` | Search Open Library |
| GET | `/api/reading/suggestions` | Get recommendations |

## Deduplication Strategy

Books can come from multiple sources. Matching logic:

```
1. ASIN match (Amazon ID) → definite same book
2. ISBN match → definite same book
3. Title + Author fuzzy match → likely same book (confirm)
```

### Merge Rules
| Field | Priority |
|-------|----------|
| `asin` | Kindle only |
| `isbn` | Open Library > Goodreads |
| `coverUrl` | Kindle > Open Library > Goodreads |
| `pageCount` | Open Library > Goodreads |
| `genres` | Merge all sources |
| `progress` | Kindle only (auto-updated) |
| `rating/notes` | Manual entry (never overwritten) |

### On Conflict
- Never overwrite user's manual ratings/notes
- Kindle progress always wins (most accurate)
- Log conflicts for manual review

## Error Handling

### Kindle Cookie Expiry
- Cookies last ~30 days
- On auth failure: GitHub Action logs error, sends notification
- **Recovery:** Update `KINDLE_COOKIES` secret in GitHub, re-run workflow
- Local data unaffected - just stops syncing until fixed

### API Failures
| Service | On Failure |
|---------|------------|
| Kindle API | Skip sync, keep existing data, log error |
| Open Library | Use partial data, retry on next sync |
| Goodreads import | Show validation errors, don't import bad rows |

### Missing Metadata
- If Open Library can't find book: store with minimal data
- Show "metadata incomplete" flag in UI
- Allow manual editing to fill gaps

## Rate Limits

| Service | Limit | Our Usage |
|---------|-------|-----------|
| Open Library | 100 requests / 5 min | Batch enrichment with delays |
| Kindle API | Unknown (private API) | Once daily, conservative |
| GitHub Actions | 2000 min/month (private) | ~1-2 min/day = ~60 min/month |

### Mitigation
- Cache Open Library responses in book record
- Only fetch metadata for new books
- Exponential backoff on rate limit errors

## Kindle Auth Setup

The kindle-api needs three pieces from your Amazon account plus an external TLS proxy.

### 1. Cookies (valid ~1 year)

Log into [read.amazon.com](https://read.amazon.com), open DevTools > Application > Cookies, and copy:
- `ubid-main`
- `at-main`
- `x-main`
- `session-id`

### 2. Device Token

On read.amazon.com, check the Network tab for a `getDeviceToken` request. Copy the `serialNumber` value.

### 3. TLS Client Server

Amazon fingerprints TLS connections, so the API needs a proxy. Host [tls-client-api](https://github.com/bogdanfinn/tls-client-api) (Go service) on:
- Your own VPS (cheap option: Hetzner, DigitalOcean)
- A small cloud run instance
- Fly.io free tier

### Environment Variables

```env
KINDLE_COOKIES="ubid-main=...; at-main=...; x-main=...; session-id=..."
KINDLE_DEVICE_TOKEN="..."
KINDLE_TLS_SERVER_URL="https://your-tls-server.example.com"
KINDLE_TLS_SERVER_API_KEY="..."
```

See `.env.example` in the repo.

## GitHub Action: Automated Kindle Sync

The sync runs automatically via GitHub Actions - like a cron job hosted by GitHub.

### How It Works

1. **Scheduled trigger** - Runs daily at 6am UTC (configurable)
2. **Manual trigger** - Click "Run workflow" in GitHub UI anytime
3. **Pulls Kindle data** - Runs sync script with your stored credentials
4. **Commits changes** - If books/progress changed, commits to repo
5. **Auto-deploys** - Vercel detects push, rebuilds site

### Workflow File

```yaml
# .github/workflows/kindle-sync.yml

name: Sync Kindle Library

on:
  schedule:
    - cron: '0 6 * * *'           # Daily at 6am UTC
  workflow_dispatch:               # Manual trigger button

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Sync Kindle library
        run: npx tsx scripts/kindle-sync.ts
        env:
          KINDLE_COOKIES: ${{ secrets.KINDLE_COOKIES }}

      - name: Commit and push changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Sync Kindle library [automated]"
          git push
```

### Setup in GitHub

Go to repo **Settings > Secrets and variables > Actions** and add these four secrets:

| Secret | Value |
|--------|-------|
| `KINDLE_COOKIES` | Cookie string from read.amazon.com |
| `KINDLE_DEVICE_TOKEN` | From getDeviceToken request |
| `KINDLE_TLS_SERVER_URL` | Your tls-client-api URL |
| `KINDLE_TLS_SERVER_API_KEY` | API key for the TLS server |

The Action will then run daily automatically.

### Cost

- **Public repos:** Free unlimited
- **Private repos:** 2,000 minutes/month free (this uses ~1-2 min/day)

### Monitoring

- View runs: **Actions** tab in GitHub
- Get notified on failure: Enable in repo notification settings
- Manual run: **Actions > Sync Kindle Library > Run workflow**

## Design Integration

Match willruns.co aesthetic:
- Dark background (`bg-black` or `bg-gray-900`)
- White text (`text-white`)
- Card-based layout
- Minimal, clean UI
- System font stack

Homepage card example:
```
┌─────────────────────────────┐
│  Reading                    │
│                             │
│  Currently: "Book Title"    │
│  2024: 12 books finished    │
└─────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/reading/books
```

## Environment Variables

```env
# Kindle API authentication
KINDLE_COOKIES='{"session-id":"...","ubid-main":"...",...}'

# Optional: if you add auth later
ADMIN_PASSWORD=your-secret-password
```
