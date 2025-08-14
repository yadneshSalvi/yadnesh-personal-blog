import ContactForm from "@/components/ContactForm";

export const dynamic = "force-static";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Contact</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-300">Get in touch.</p>
      </header>

      <ContactForm />

      <div className="prose dark:prose-invert">
        <p className="text-zinc-700 dark:text-zinc-300">
          Prefer asynchronous vibes? Ping me on X/Twitter or open an issue on my blog repo.
        </p>
      </div>
    </main>
  );
}


