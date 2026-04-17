import { NextRequest, NextResponse } from 'next/server';
import { books, entries } from '@/lib/reading/storage';

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  const { id } = await params;
  const book = await books.find(id);
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }
  return NextResponse.json(book);
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const patch = await req.json();
  const updated = await books.update(id, patch);
  if (!updated) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const { id } = await params;
  const entry = await entries.findByBookId(id);
  if (entry) {
    await entries.remove(entry.id);
  }
  const removed = await books.remove(id);
  if (!removed) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
