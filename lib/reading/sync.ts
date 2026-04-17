import { books, entries } from './storage';
import type { SyncedBook } from './kindle';
import type { Book, ReadingEntry, ReadingStatus } from '@/types/reading';

export interface SyncResult {
  booksAdded: number;
  booksUpdated: number;
  entriesCreated: number;
  entriesUpdated: number;
  skipped: number;
  errors: string[];
}

export async function syncKindleBooks(
  kindleBooks: SyncedBook[]
): Promise<SyncResult> {
  const result: SyncResult = {
    booksAdded: 0,
    booksUpdated: 0,
    entriesCreated: 0,
    entriesUpdated: 0,
    skipped: 0,
    errors: [],
  };

  const existingBooks = await books.all();
  const byAsin = new Map(
    existingBooks.filter((b) => b.asin).map((b) => [b.asin!, b])
  );

  for (const kBook of kindleBooks) {
    try {
      const existing = byAsin.get(kBook.asin);

      if (existing) {
        await updateFromKindle(existing, kBook, result);
      } else {
        await createFromKindle(kBook, result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${kBook.title}: ${msg}`);
    }
  }

  return result;
}

async function createFromKindle(
  kBook: SyncedBook,
  result: SyncResult
): Promise<void> {
  if (kBook.bookType === 'sample') {
    result.skipped++;
    return;
  }

  const book = await books.create({
    title: kBook.title,
    authors: kBook.authors,
    asin: kBook.asin,
    coverUrl: kBook.coverUrl,
    genres: [],
  });
  result.booksAdded++;

  await entries.create({
    bookId: book.id,
    status: statusFromProgress(kBook.percentageRead),
    progress: kBook.percentageRead,
    favorite: false,
    kindleLastSynced: kBook.syncDate,
  });
  result.entriesCreated++;
}

async function updateFromKindle(
  existing: Book,
  kBook: SyncedBook,
  result: SyncResult
): Promise<void> {
  const bookPatch: Partial<Book> = {};
  if (!existing.coverUrl && kBook.coverUrl) bookPatch.coverUrl = kBook.coverUrl;
  if (existing.authors.length === 0) bookPatch.authors = kBook.authors;

  if (Object.keys(bookPatch).length > 0) {
    await books.update(existing.id, bookPatch);
    result.booksUpdated++;
  }

  const entry = await entries.findByBookId(existing.id);
  const newStatus = statusFromProgress(kBook.percentageRead);

  if (!entry) {
    await entries.create({
      bookId: existing.id,
      status: newStatus,
      progress: kBook.percentageRead,
      favorite: false,
      kindleLastSynced: kBook.syncDate,
    });
    result.entriesCreated++;
    return;
  }

  const entryPatch: Partial<ReadingEntry> = {
    progress: kBook.percentageRead,
    kindleLastSynced: kBook.syncDate,
  };

  if (shouldUpdateStatus(entry.status, newStatus)) {
    entryPatch.status = newStatus;
    if (newStatus === 'finished' && !entry.finishDate) {
      entryPatch.finishDate = new Date().toISOString().slice(0, 10);
    }
    if (newStatus === 'reading' && !entry.startDate) {
      entryPatch.startDate = new Date().toISOString().slice(0, 10);
    }
  }

  await entries.update(entry.id, entryPatch);
  result.entriesUpdated++;
}

function statusFromProgress(percent: number): ReadingStatus {
  if (percent >= 95) return 'finished';
  if (percent > 0) return 'reading';
  return 'want-to-read';
}

function shouldUpdateStatus(
  current: ReadingStatus,
  derived: ReadingStatus
): boolean {
  if (current === 'abandoned') return false;
  if (current === 'finished' && derived !== 'finished') return false;
  return current !== derived;
}
