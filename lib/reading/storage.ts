import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Book, ReadingEntry, ReadingList } from '@/types/reading';

const DATA_DIR = path.join(process.cwd(), 'data');

const FILES = {
  books: path.join(DATA_DIR, 'books.json'),
  reading: path.join(DATA_DIR, 'reading.json'),
  lists: path.join(DATA_DIR, 'lists.json'),
} as const;

async function readJson<T>(filePath: string): Promise<T[]> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T[];
}

async function writeJson<T>(filePath: string, data: T[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export const books = {
  all: () => readJson<Book>(FILES.books),
  find: async (id: string) => {
    const all = await readJson<Book>(FILES.books);
    return all.find((b) => b.id === id) ?? null;
  },
  create: async (
    data: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Book> => {
    const all = await readJson<Book>(FILES.books);
    const now = new Date().toISOString();
    const book: Book = {
      ...data,
      id: randomUUID(),
      genres: data.genres ?? [],
      createdAt: now,
      updatedAt: now,
    };
    all.push(book);
    await writeJson(FILES.books, all);
    return book;
  },
  update: async (
    id: string,
    patch: Partial<Omit<Book, 'id' | 'createdAt'>>
  ): Promise<Book | null> => {
    const all = await readJson<Book>(FILES.books);
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const updated: Book = {
      ...all[idx],
      ...patch,
      id: all[idx].id,
      createdAt: all[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await writeJson(FILES.books, all);
    return updated;
  },
  remove: async (id: string): Promise<boolean> => {
    const all = await readJson<Book>(FILES.books);
    const next = all.filter((b) => b.id !== id);
    if (next.length === all.length) return false;
    await writeJson(FILES.books, next);
    return true;
  },
};

export const entries = {
  all: () => readJson<ReadingEntry>(FILES.reading),
  find: async (id: string) => {
    const all = await readJson<ReadingEntry>(FILES.reading);
    return all.find((e) => e.id === id) ?? null;
  },
  findByBookId: async (bookId: string) => {
    const all = await readJson<ReadingEntry>(FILES.reading);
    return all.find((e) => e.bookId === bookId) ?? null;
  },
  create: async (
    data: Omit<ReadingEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReadingEntry> => {
    const all = await readJson<ReadingEntry>(FILES.reading);
    const now = new Date().toISOString();
    const entry: ReadingEntry = {
      ...data,
      favorite: data.favorite ?? false,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    all.push(entry);
    await writeJson(FILES.reading, all);
    return entry;
  },
  update: async (
    id: string,
    patch: Partial<Omit<ReadingEntry, 'id' | 'createdAt'>>
  ): Promise<ReadingEntry | null> => {
    const all = await readJson<ReadingEntry>(FILES.reading);
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const updated: ReadingEntry = {
      ...all[idx],
      ...patch,
      id: all[idx].id,
      createdAt: all[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await writeJson(FILES.reading, all);
    return updated;
  },
  remove: async (id: string): Promise<boolean> => {
    const all = await readJson<ReadingEntry>(FILES.reading);
    const next = all.filter((e) => e.id !== id);
    if (next.length === all.length) return false;
    await writeJson(FILES.reading, next);
    return true;
  },
};

export const lists = {
  all: () => readJson<ReadingList>(FILES.lists),
  find: async (id: string) => {
    const all = await readJson<ReadingList>(FILES.lists);
    return all.find((l) => l.id === id) ?? null;
  },
  create: async (
    data: Omit<ReadingList, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReadingList> => {
    const all = await readJson<ReadingList>(FILES.lists);
    const now = new Date().toISOString();
    const list: ReadingList = {
      ...data,
      id: randomUUID(),
      bookIds: data.bookIds ?? [],
      isPublic: data.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    };
    all.push(list);
    await writeJson(FILES.lists, all);
    return list;
  },
  update: async (
    id: string,
    patch: Partial<Omit<ReadingList, 'id' | 'createdAt'>>
  ): Promise<ReadingList | null> => {
    const all = await readJson<ReadingList>(FILES.lists);
    const idx = all.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    const updated: ReadingList = {
      ...all[idx],
      ...patch,
      id: all[idx].id,
      createdAt: all[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await writeJson(FILES.lists, all);
    return updated;
  },
  remove: async (id: string): Promise<boolean> => {
    const all = await readJson<ReadingList>(FILES.lists);
    const next = all.filter((l) => l.id !== id);
    if (next.length === all.length) return false;
    await writeJson(FILES.lists, next);
    return true;
  },
};
