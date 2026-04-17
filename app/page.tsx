export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Reading List</h1>
      <p className="text-gray-400">
        MVP 1 scaffolded. Visit{' '}
        <a href="/api/reading/books" className="underline">
          /api/reading/books
        </a>{' '}
        to see the API.
      </p>
    </main>
  );
}
