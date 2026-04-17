import { NextRequest, NextResponse } from 'next/server';
import { books } from '@/lib/reading/storage';

export async function GET() {
  const all = await books.all();
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title || !Array.isArray(body.authors) || body.authors.length === 0) {
    return NextResponse.json(
      { error: 'title and authors (non-empty array) are required' },
      { status: 400 }
    );
  }

  const book = await books.create({
    title: body.title,
    authors: body.authors,
    isbn: body.isbn,
    asin: body.asin,
    coverUrl: body.coverUrl,
    pageCount: body.pageCount,
    genres: body.genres ?? [],
    description: body.description,
    openLibraryId: body.openLibraryId,
  });

  return NextResponse.json(book, { status: 201 });
}
