export type ReadingStatus =
  | 'want-to-read'
  | 'reading'
  | 'finished'
  | 'abandoned';

export interface Book {
  id: string;
  title: string;
  authors: string[];
  isbn?: string;
  asin?: string;
  coverUrl?: string;
  pageCount?: number;
  genres: string[];
  description?: string;
  openLibraryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingEntry {
  id: string;
  bookId: string;
  status: ReadingStatus;
  rating?: number;
  progress?: number;
  startDate?: string;
  finishDate?: string;
  notes?: string;
  favorite: boolean;
  kindleLastSynced?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingList {
  id: string;
  name: string;
  description?: string;
  bookIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewBook = Omit<Book, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<Book, 'genres'>>;

export type UpdateBook = Partial<Omit<Book, 'id' | 'createdAt' | 'updatedAt'>>;

export type NewReadingEntry = Omit<
  ReadingEntry,
  'id' | 'createdAt' | 'updatedAt' | 'favorite'
> &
  Partial<Pick<ReadingEntry, 'favorite'>>;

export type UpdateReadingEntry = Partial<
  Omit<ReadingEntry, 'id' | 'createdAt' | 'updatedAt'>
>;
