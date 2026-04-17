import { NextRequest, NextResponse } from 'next/server';
import { entries } from '@/lib/reading/storage';
import type { ReadingStatus } from '@/types/reading';

type Context = { params: Promise<{ id: string }> };

const VALID_STATUSES: ReadingStatus[] = [
  'want-to-read',
  'reading',
  'finished',
  'abandoned',
];

export async function GET(_req: NextRequest, { params }: Context) {
  const { id } = await params;
  const entry = await entries.find(id);
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { id } = await params;
  const patch = await req.json();

  if (patch.status && !VALID_STATUSES.includes(patch.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const updated = await entries.update(id, patch);
  if (!updated) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const { id } = await params;
  const removed = await entries.remove(id);
  if (!removed) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
