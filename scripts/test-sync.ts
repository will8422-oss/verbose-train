#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { syncKindleBooks } from '../lib/reading/sync';
import { books, entries } from '../lib/reading/storage';
import type { SyncedBook } from '../lib/reading/kindle';

const DATA_DIR = path.join(process.cwd(), 'data');

async function reset() {
  await fs.writeFile(path.join(DATA_DIR, 'books.json'), '[]\n');
  await fs.writeFile(path.join(DATA_DIR, 'reading.json'), '[]\n');
  await fs.writeFile(path.join(DATA_DIR, 'lists.json'), '[]\n');
}

function mockBook(overrides: Partial<SyncedBook> = {}): SyncedBook {
  return {
    asin: 'B08FHBV4ZX',
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    coverUrl: 'https://example.com/cover.jpg',
    percentageRead: 0,
    syncDate: new Date().toISOString(),
    bookType: 'owned',
    ...overrides,
  };
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function testCreateNewBook() {
  console.log('\nTest: creates new book and entry from Kindle');
  await reset();
  const result = await syncKindleBooks([mockBook({ percentageRead: 50 })]);

  assert(result.booksAdded === 1, 'booksAdded === 1');
  assert(result.entriesCreated === 1, 'entriesCreated === 1');
  assert(result.errors.length === 0, 'no errors');

  const allBooks = await books.all();
  assert(allBooks.length === 1, 'one book stored');
  assert(allBooks[0].asin === 'B08FHBV4ZX', 'asin matches');

  const allEntries = await entries.all();
  assert(allEntries[0].status === 'reading', 'status = reading at 50%');
  assert(allEntries[0].progress === 50, 'progress = 50');
}

async function testStatusTransitions() {
  console.log('\nTest: status transitions with progress');
  await reset();

  await syncKindleBooks([mockBook({ percentageRead: 0 })]);
  let entry = (await entries.all())[0];
  assert(entry.status === 'want-to-read', '0% -> want-to-read');

  await syncKindleBooks([mockBook({ percentageRead: 30 })]);
  entry = (await entries.all())[0];
  assert(entry.status === 'reading', '30% -> reading');
  assert(entry.startDate !== undefined, 'startDate set on first reading');

  await syncKindleBooks([mockBook({ percentageRead: 99 })]);
  entry = (await entries.all())[0];
  assert(entry.status === 'finished', '99% -> finished');
  assert(entry.finishDate !== undefined, 'finishDate set on finish');
}

async function testPreservesManualData() {
  console.log('\nTest: preserves manual ratings and notes');
  await reset();

  await syncKindleBooks([mockBook({ percentageRead: 100 })]);
  const entry = (await entries.all())[0];

  await entries.update(entry.id, {
    rating: 5,
    notes: 'Loved it',
    favorite: true,
  });

  await syncKindleBooks([mockBook({ percentageRead: 100 })]);
  const updated = (await entries.all())[0];

  assert(updated.rating === 5, 'rating preserved');
  assert(updated.notes === 'Loved it', 'notes preserved');
  assert(updated.favorite === true, 'favorite preserved');
}

async function testAbandonedNotOverwritten() {
  console.log('\nTest: abandoned status never overwritten');
  await reset();

  await syncKindleBooks([mockBook({ percentageRead: 30 })]);
  const entry = (await entries.all())[0];
  await entries.update(entry.id, { status: 'abandoned' });

  await syncKindleBooks([mockBook({ percentageRead: 100 })]);
  const updated = (await entries.all())[0];

  assert(updated.status === 'abandoned', 'abandoned stays abandoned');
}

async function testFinishedNotReverted() {
  console.log('\nTest: finished not reverted to reading');
  await reset();

  await syncKindleBooks([mockBook({ percentageRead: 100 })]);
  const entry = (await entries.all())[0];
  assert(entry.status === 'finished', 'initial status finished');

  await syncKindleBooks([mockBook({ percentageRead: 80 })]);
  const updated = (await entries.all())[0];
  assert(updated.status === 'finished', 'stays finished');
}

async function testSkipsSamples() {
  console.log('\nTest: skips book samples');
  await reset();

  const result = await syncKindleBooks([
    mockBook({ asin: 'A1', bookType: 'sample' }),
    mockBook({ asin: 'A2', bookType: 'owned' }),
  ]);

  assert(result.booksAdded === 1, 'only owned book added');
  assert(result.skipped === 1, 'sample skipped');
}

async function testMatchByAsin() {
  console.log('\nTest: matches existing book by ASIN');
  await reset();

  await books.create({
    title: 'Manually Added Hail Mary',
    authors: ['Andy Weir'],
    asin: 'B08FHBV4ZX',
    genres: ['sci-fi'],
  });

  const result = await syncKindleBooks([mockBook({ percentageRead: 75 })]);

  assert(result.booksAdded === 0, 'no duplicate created');
  assert(result.entriesCreated === 1, 'entry created for existing book');

  const allBooks = await books.all();
  assert(allBooks.length === 1, 'still one book');
  assert(allBooks[0].title === 'Manually Added Hail Mary', 'title preserved');
  assert(allBooks[0].genres[0] === 'sci-fi', 'genres preserved');
}

async function main() {
  try {
    await testCreateNewBook();
    await testStatusTransitions();
    await testPreservesManualData();
    await testAbandonedNotOverwritten();
    await testFinishedNotReverted();
    await testSkipsSamples();
    await testMatchByAsin();

    await reset();
    console.log('\nAll sync tests passed.');
  } catch (err) {
    console.error('Test error:', err);
    await reset();
    process.exit(1);
  }
}

main();
