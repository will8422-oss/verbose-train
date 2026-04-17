import { NextRequest, NextResponse } from 'next/server';
import { books, entries } from '@/lib/reading/storage';
import type { ReadingStatus } from '@/types/reading';

const VALID_STATUSES: ReadingStatus[] = [
  'want-to-read',
  'reading',
  'finished',
  'abandoned',
];

export async function GET() {
  const all = await entries.all();
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.bookId || !body.status) {
    return NextResponse.json(
      { error: 'bookId and status are required' },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const book = await books.find(body.bookId);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const existing = await entries.findByBookId(body.bookId);
  if (existing) {
    return NextResponse.json(
      { error: 'Entry already exists for this book', entry: existing },
      { status: 409 }
    );
  }

  const entry = await entries.create({
    bookId: body.bookId,
    status: body.status,
    rating: body.rating,
    progress: body.progress,
    startDate: body.startDate,
    finishDate: body.finishDate,
    notes: body.notes,
    favorite: body.favorite ?? false,
    kindleLastSynced: body.kindleLastSynced,
  });

  return NextResponse.json(entry, { status: 201 });
}
