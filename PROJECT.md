# Kindle Reading List

A reading list feature for [willruns.co](https://www.willruns.co/) that syncs with Kindle, tracks books, and surfaces reading data on the personal website.

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
| Data Storage | JSON files |
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
- [ ] **Test:** Add, edit, delete, list books via API

### MVP 2: Kindle Integration
**Goal:** Sync books from Kindle account

- [ ] Install and configure kindle-api
- [ ] Kindle auth (cookie-based)
- [ ] Sync endpoint (`/api/reading/kindle/sync`)
- [ ] Merge logic (Kindle data + local data)
- [ ] **Test:** Pull Kindle library, verify merge

### MVP 3: Metadata & Lists
**Goal:** Enrich book data, create reading lists

- [ ] Open Library API client
- [ ] Auto-fetch genres, page counts, descriptions
- [ ] Reading lists CRUD (`/api/reading/lists`)
- [ ] Add/remove books from lists
- [ ] **Test:** Create list, add books, verify metadata

### MVP 4: Suggestions & Import
**Goal:** Smart recommendations, data import

- [ ] Suggestions engine (genre/author based)
- [ ] Goodreads CSV parser
- [ ] Import endpoint (`/api/reading/import`)
- [ ] **Test:** Import Goodreads data, get suggestions

### MVP 5: Frontend UI
**Goal:** Pages that match willruns.co design

- [ ] `/reading` - Dashboard (currently reading, recent)
- [ ] `/reading/library` - Full library with filters
- [ ] `/reading/lists` - All reading lists
- [ ] `/reading/lists/[id]` - Single list view
- [ ] Homepage card component
- [ ] **Test:** Full UI walkthrough

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

## Kindle Auth Setup

The kindle-api requires Amazon session cookies:

1. Log into [read.amazon.com](https://read.amazon.com) in your browser
2. Open DevTools > Application > Cookies
3. Copy these cookies:
   - `session-id`
   - `session-id-time`
   - `ubid-main`
   - `x-main`
   - `at-main`
   - `sess-at-main`
4. Add to `.env.local`:
   ```
   KINDLE_COOKIES='{"session-id":"...","ubid-main":"...",...}'
   ```

Cookies typically last ~30 days before needing refresh.

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
