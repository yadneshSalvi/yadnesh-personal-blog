export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">About</h1>
        <p className="text-sm text-zinc-500">A few words about this site.</p>
      </header>
      <div className="prose dark:prose-invert">
        <p>
          This is Yadnesh&apos;s personal blog where I write about software, web
          performance, and developer experience.
        </p>
      </div>
    </main>
  );
}


