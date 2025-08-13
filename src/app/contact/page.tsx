export const dynamic = "force-static";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Contact</h1>
        <p className="text-sm text-zinc-500">Get in touch.</p>
      </header>
      <div className="prose dark:prose-invert">
        <p>
          You can reach me on X/Twitter or open an issue on my blog repo for
          feedback and suggestions.
        </p>
      </div>
    </main>
  );
}


