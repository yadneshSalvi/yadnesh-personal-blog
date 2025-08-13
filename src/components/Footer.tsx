export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-zinc-200/80 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:supports-[backdrop-filter]:bg-zinc-950/50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">© {year} YS</span>
        <span className="text-zinc-600 dark:text-zinc-400">
          Built with {" "}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-800 hover:underline dark:text-zinc-200"
          >
            Next.js
          </a>
        </span>
      </div>
    </footer>
  );
}


