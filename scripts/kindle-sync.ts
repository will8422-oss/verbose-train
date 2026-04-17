#!/usr/bin/env node
import {
  configFromEnv,
  connectKindle,
  fetchLibrary,
  KindleAuthError,
} from '../lib/reading/kindle';
import { syncKindleBooks } from '../lib/reading/sync';

async function main() {
  console.log('Kindle sync starting...');

  let config;
  try {
    config = configFromEnv();
  } catch (err) {
    if (err instanceof KindleAuthError) {
      console.error(`Config error: ${err.message}`);
      process.exit(78);
    }
    throw err;
  }

  let kindle;
  try {
    kindle = await connectKindle(config);
  } catch (err) {
    if (err instanceof KindleAuthError) {
      console.error(`::error title=Kindle auth failed::${err.message}`);
      console.error('Refresh cookies at read.amazon.com and update KINDLE_COOKIES secret.');
      process.exit(77);
    }
    throw err;
  }

  console.log('Connected. Fetching library...');

  const library = await fetchLibrary(kindle, { delayMs: 2000 });
  console.log(`Fetched ${library.length} books from Kindle.`);

  const result = await syncKindleBooks(library);

  console.log('\nSync complete:');
  console.log(`  Books added:     ${result.booksAdded}`);
  console.log(`  Books updated:   ${result.booksUpdated}`);
  console.log(`  Entries created: ${result.entriesCreated}`);
  console.log(`  Entries updated: ${result.entriesUpdated}`);
  console.log(`  Skipped:         ${result.skipped}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
