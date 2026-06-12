import ContactForm from "@/components/ContactForm";
import CalendarBooking from "@/components/CalendarBooking";

export const dynamic = "force-static";

export const metadata = {
  title: "Contact",
};

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yadnesh-salvi-bb5151ba" },
  { label: "X", href: "https://x.com/yadnesh_sa88965" },
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Contact
        </p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">
          Get in touch.
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-muted">
          Questions, collaboration, or a second opinion on an AI system — my
          inbox is open. Write a note below, or book a call directly.
        </p>
      </header>

      <div className="mt-12">
        <ContactForm />
      </div>

      <div className="mt-12 space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-line" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            or book a call
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <CalendarBooking />
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <p className="text-sm text-muted">Prefer asynchronous? Find me on:</p>
        <div className="mt-3 flex gap-6">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
            >
              {s.label}
              <span aria-hidden className="ml-0.5">
                ↗
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
