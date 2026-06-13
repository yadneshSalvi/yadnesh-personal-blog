"use client";

import * as React from "react";
import clsx from "clsx";

/**
 * End-of-part knowledge check. Editorial "ink & paper" styling: hairline rows,
 * mono labels, accent for the current selection, green for the right answer,
 * rose for a wrong pick. The score updates as each question is submitted.
 * State is per-mount only; a refresh resets it (no persistence by design).
 *
 * Authored in MDX as:
 *   <Quiz questions={[
 *     { q: "What does `--reload` do?",
 *       options: ["...","...","...","..."],
 *       answer: 1,
 *       explain: "It restarts the server on save." },
 *     ...
 *   ]} />
 */

export type QuizQuestion = {
  /** The prompt. Inline `code` (backticks) is rendered. */
  q: string;
  /** Exactly four choices. Inline `code` supported. */
  options: string[];
  /** Index (0-3) of the correct option. */
  answer: number;
  /** Shown after submit. Inline `code` supported. */
  explain?: string;
};

export type QuizProps = {
  questions: QuizQuestion[];
  /** Heading text; defaults to "Test yourself". */
  title?: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function withInlineCode(text: string): React.ReactNode {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code
        key={i}
        className="rounded bg-surface px-1 py-0.5 font-mono text-[0.85em] text-ink"
      >
        {part}
      </code>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

const Mark = ({ kind }: { kind: "check" | "cross" }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
    {kind === "check" ? (
      <path d="M9 16.17 5.53 12.7l-1.41 1.41L9 19 20.88 7.12l-1.41-1.41z" />
    ) : (
      <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.41L10.59 13.4l-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.29z" />
    )}
  </svg>
);

export default function Quiz({ questions, title = "Test yourself" }: QuizProps) {
  const [selected, setSelected] = React.useState<(number | null)[]>(() =>
    questions.map(() => null)
  );
  const [submitted, setSubmitted] = React.useState<boolean[]>(() =>
    questions.map(() => false)
  );

  const answered = submitted.filter(Boolean).length;
  const correct = questions.reduce(
    (n, q, i) => (submitted[i] && selected[i] === q.answer ? n + 1 : n),
    0
  );
  const allDone = answered === questions.length;

  const choose = (qi: number, oi: number) => {
    if (submitted[qi]) return;
    setSelected((prev) => prev.map((v, i) => (i === qi ? oi : v)));
  };

  const submit = (qi: number) => {
    if (selected[qi] == null || submitted[qi]) return;
    setSubmitted((prev) => prev.map((v, i) => (i === qi ? true : v)));
  };

  const onKey = (e: React.KeyboardEvent, qi: number, oi: number) => {
    if (submitted[qi]) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      choose(qi, (oi + 1) % questions[qi].options.length);
      focusOption(qi, (oi + 1) % questions[qi].options.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const n = questions[qi].options.length;
      choose(qi, (oi - 1 + n) % n);
      focusOption(qi, (oi - 1 + n) % n);
    }
  };

  const optRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const focusOption = (qi: number, oi: number) => optRefs.current[`${qi}-${oi}`]?.focus();

  return (
    <section className="not-prose my-12">
      <header className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="m-0 scroll-mt-24 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-faint">
          {title}
        </h2>
        <div
          className="font-mono text-[11px] uppercase tracking-[0.15em]"
          aria-live="polite"
          aria-label={answered ? `Score ${correct} of ${answered}` : "Score, nothing answered yet"}
        >
          <span className="text-faint">Score </span>
          {answered ? (
            <span className="tabular-nums text-ink">
              {correct} / {answered}
            </span>
          ) : (
            <span className="text-faint">&middot;&middot;</span>
          )}
        </div>
      </header>

      {questions.map((q, qi) => {
        const isDone = submitted[qi];
        const pick = selected[qi];
        const gotIt = isDone && pick === q.answer;

        return (
          <div key={qi} className="border-b border-line py-7">
            <div className="flex gap-3 sm:gap-4">
              <span className="pt-[3px] font-mono text-[13px] tabular-nums text-faint">
                {String(qi + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 font-serif text-lg leading-snug text-ink">
                  {withInlineCode(q.q)}
                </p>

                <ul
                  role="radiogroup"
                  aria-label={q.q}
                  className="mt-4 space-y-px"
                >
                  {q.options.map((opt, oi) => {
                    const chosen = pick === oi;
                    const isAnswer = oi === q.answer;
                    const showCorrect = isDone && isAnswer;
                    const showWrong = isDone && chosen && !isAnswer;

                    return (
                      <li key={oi}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={chosen}
                          disabled={isDone}
                          tabIndex={chosen || (pick == null && oi === 0) ? 0 : -1}
                          ref={(el) => {
                            optRefs.current[`${qi}-${oi}`] = el;
                          }}
                          onClick={() => choose(qi, oi)}
                          onKeyDown={(e) => onKey(e, qi, oi)}
                          className={clsx(
                            "group flex w-full items-start gap-2.5 rounded-sm py-1.5 pl-2 pr-3 text-left text-[15px] transition-colors",
                            "border-l-2",
                            !isDone &&
                              (chosen
                                ? "border-accent text-ink"
                                : "border-transparent text-muted hover:text-ink"),
                            showCorrect && "border-green-500 text-green-700 dark:text-green-300",
                            showWrong && "border-rose-400 text-rose-600 line-through decoration-1 dark:text-rose-400",
                            isDone && !showCorrect && !showWrong && "border-transparent text-faint",
                            !isDone && "cursor-pointer"
                          )}
                        >
                          <span
                            className={clsx(
                              "inline-flex w-4 shrink-0 justify-center pt-[3px] font-mono text-[12px]",
                              showCorrect && "text-green-600 dark:text-green-400",
                              showWrong && "text-rose-500",
                              !isDone && chosen && "text-accent",
                              !isDone && !chosen && "text-faint group-hover:text-muted"
                            )}
                          >
                            {showCorrect ? (
                              <Mark kind="check" />
                            ) : showWrong ? (
                              <Mark kind="cross" />
                            ) : (
                              LETTERS[oi]
                            )}
                          </span>
                          <span className="min-w-0">{withInlineCode(opt)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {!isDone ? (
                  <div className="mt-4 pl-2">
                    <button
                      type="button"
                      onClick={() => submit(qi)}
                      disabled={pick == null}
                      className={clsx(
                        "rounded-sm border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
                        pick == null
                          ? "cursor-not-allowed border-line text-faint opacity-50"
                          : "cursor-pointer border-accent text-accent hover:bg-accent hover:text-paper"
                      )}
                    >
                      Submit
                    </button>
                  </div>
                ) : (
                  <div
                    className={clsx(
                      "mt-4 border-l-2 pl-4",
                      gotIt ? "border-green-400" : "border-rose-300 dark:border-rose-500/60"
                    )}
                  >
                    <p
                      className={clsx(
                        "m-0 font-mono text-[11px] uppercase tracking-[0.2em]",
                        gotIt ? "text-green-600 dark:text-green-400" : "text-rose-500 dark:text-rose-400"
                      )}
                    >
                      {gotIt ? "Correct" : "Not quite"}
                    </p>
                    {q.explain ? (
                      <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted">
                        {withInlineCode(q.explain)}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {allDone ? (
        <p className="pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
          You scored{" "}
          <span className="tabular-nums text-ink">
            {correct} / {questions.length}
          </span>
          . {correct === questions.length ? "Spotless." : correct >= Math.ceil(questions.length / 2) ? "Solid." : "Worth a re-skim."} Refresh to reset.
        </p>
      ) : null}
    </section>
  );
}
