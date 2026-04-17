import { Kindle, type KindleBook, type KindleBookDetails } from 'kindle-api';

export interface KindleConfig {
  cookies: string;
  deviceToken: string;
  tlsServerUrl: string;
  tlsServerApiKey: string;
}

export interface SyncedBook {
  asin: string;
  title: string;
  authors: string[];
  coverUrl: string;
  percentageRead: number;
  syncDate: string;
  publisher?: string;
  releaseDate?: string;
  bookType: 'owned' | 'sample' | 'unknown';
}

export class KindleAuthError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'KindleAuthError';
  }
}

export function configFromEnv(): KindleConfig {
  const cookies = process.env.KINDLE_COOKIES;
  const deviceToken = process.env.KINDLE_DEVICE_TOKEN;
  const tlsServerUrl = process.env.KINDLE_TLS_SERVER_URL;
  const tlsServerApiKey = process.env.KINDLE_TLS_SERVER_API_KEY;

  const missing = [
    ['KINDLE_COOKIES', cookies],
    ['KINDLE_DEVICE_TOKEN', deviceToken],
    ['KINDLE_TLS_SERVER_URL', tlsServerUrl],
    ['KINDLE_TLS_SERVER_API_KEY', tlsServerApiKey],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new KindleAuthError(
      `Missing environment variables: ${missing.join(', ')}`
    );
  }

  return {
    cookies: cookies!,
    deviceToken: deviceToken!,
    tlsServerUrl: tlsServerUrl!,
    tlsServerApiKey: tlsServerApiKey!,
  };
}

export async function connectKindle(config: KindleConfig): Promise<Kindle> {
  try {
    return await Kindle.fromConfig({
      cookies: config.cookies,
      deviceToken: config.deviceToken,
      tlsServer: {
        url: config.tlsServerUrl,
        apiKey: config.tlsServerApiKey,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/401|403|auth|cookie|session/i.test(msg)) {
      throw new KindleAuthError(
        'Kindle authentication failed - cookies may be expired',
        err
      );
    }
    throw err;
  }
}

export async function fetchLibrary(
  kindle: Kindle,
  { delayMs = 2000 }: { delayMs?: number } = {}
): Promise<SyncedBook[]> {
  const books = await kindle.books();
  const results: SyncedBook[] = [];

  for (const book of books) {
    const details = await book.fullDetails();
    results.push(toSyncedBook(book, details));
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return results;
}

function toSyncedBook(book: KindleBook, details: KindleBookDetails): SyncedBook {
  return {
    asin: book.asin,
    title: book.title,
    authors: book.authors.map((a) => `${a.firstName} ${a.lastName}`.trim()),
    coverUrl: details.largeCoverUrl ?? book.productUrl,
    percentageRead: details.percentageRead ?? 0,
    syncDate: details.progress.syncDate.toISOString(),
    publisher: details.publisher,
    releaseDate: details.releaseDate,
    bookType: details.bookType,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
