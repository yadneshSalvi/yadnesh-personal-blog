import ContactForm from "@/components/ContactForm";
import CalendarBooking from "@/components/CalendarBooking";
import { ComponentType, SVGProps } from "react";

export const dynamic = "force-static";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Contact</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-300">Get in touch.</p>
      </header>

      <ContactForm />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-700" />
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">or</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-700" />
        </div>
        
        <CalendarBooking />
      </div>

      <div className="prose dark:prose-invert">
        <p className="text-zinc-700 dark:text-zinc-300 mb-4">
          Prefer asynchronous vibes? Connect with me on social:
        </p>
        <div className="flex gap-2 not-prose">
          <ContactItem href="https://www.linkedin.com/in/yadnesh-salvi-bb5151ba" label="LinkedIn" Icon={LinkedInIcon} />
          <ContactItem href="https://x.com/yadnesh_sa88965" label="Twitter" Icon={XIcon} />
        </div>
      </div>
    </main>
  );
}

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function ContactItem({ href, label, Icon }: { href: string; label: string; Icon: ComponentType<IconProps> }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white/70 px-2 py-1 text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </a>
  );
}

function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.3 8.5h4.4V24H.3V8.5zM8.7 8.5h4.216v2.108h.061c.588-1.117 2.026-2.296 4.17-2.296 4.458 0 5.279 2.936 5.279 6.754V24H18.02v-6.931c0-1.653-.03-3.777-2.303-3.777-2.306 0-2.659 1.799-2.659 3.658V24H8.7V8.5z" />
    </svg>
  );
}

function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 3h3.9l5.4 7.6L18.6 3H22l-7.8 10.8L22 21h-3.9l-6-8.4L5.4 21H2l8.3-11.4L3 3z" />
    </svg>
  );
}
