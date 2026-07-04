"use client";

import { useState } from "react";
import type { Answers, QuestionBlock } from "@/lib/types";

// The agent's structured question, rendered as chips. While this card is
// pending the agent is parked on the same kind of Future as an approval
// card; the difference is the cargo, not the machinery. One click per
// question (or several, when multiSelect allows), then Send answers.
export function QuestionCard({
  block,
  onAnswer,
}: {
  block: QuestionBlock;
  onAnswer: (id: string, answers: Answers) => void;
}) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [sent, setSent] = useState(false);

  if (block.status !== "pending") {
    const answered = block.status === "answered";
    return (
      <div className="my-1.5 flex max-w-xl flex-col gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-800 dark:bg-stone-900/60">
        {answered && block.answers ? (
          Object.entries(block.answers).map(([q, a]) => (
            <div key={q} className="flex items-baseline gap-2 text-[13px]">
              <span className="text-stone-400 dark:text-stone-500">{q}</span>
              <span className="font-medium text-stone-700 dark:text-stone-200">
                {Array.isArray(a) ? a.join(", ") : a}
              </span>
            </div>
          ))
        ) : (
          <span className="text-[13px] text-stone-500 dark:text-stone-400">
            Question expired (nobody answered in time)
          </span>
        )}
        <span className="font-mono text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {answered ? "Answered" : "Unanswered"}
        </span>
      </div>
    );
  }

  const toggle = (question: string, label: string, multi: boolean) => {
    setPicked((all) => {
      const current = all[question] ?? [];
      if (!multi) return { ...all, [question]: [label] };
      return {
        ...all,
        [question]: current.includes(label)
          ? current.filter((l) => l !== label)
          : [...current, label],
      };
    });
  };

  const complete = block.questions.every((q) => (picked[q.question] ?? []).length > 0);

  const submit = () => {
    setSent(true);
    const answers: Answers = {};
    for (const q of block.questions) {
      const labels = picked[q.question] ?? [];
      answers[q.question] = q.multiSelect ? labels : labels[0];
    }
    onAnswer(block.id, answers);
  };

  return (
    <div className="my-2 max-w-xl overflow-hidden rounded-lg border-2 border-accent/50 bg-white dark:bg-stone-900">
      <div className="flex items-center gap-2.5 border-b border-stone-200 px-3 py-2 dark:border-stone-800">
        <span className="size-2 animate-pulse rounded-full bg-accent" />
        <span className="text-[13px] font-medium text-stone-700 dark:text-stone-200">
          The analyst has a question
        </span>
      </div>
      <div className="flex flex-col gap-3 px-3 py-2.5">
        {block.questions.map((q) => (
          <div key={q.question}>
            <p className="mb-1.5 text-[13px] text-stone-700 dark:text-stone-200">{q.question}</p>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((opt) => {
                const on = (picked[q.question] ?? []).includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    title={opt.description}
                    disabled={sent}
                    onClick={() => toggle(q.question, opt.label, q.multiSelect)}
                    className={`rounded-full border px-3 py-1 text-[13px] disabled:opacity-40 ${
                      on
                        ? "border-accent bg-accent text-white"
                        : "border-stone-300 text-stone-600 hover:border-accent hover:text-accent dark:border-stone-700 dark:text-stone-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <button
            type="button"
            disabled={!complete || sent}
            onClick={submit}
            className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Send answers
          </button>
        </div>
      </div>
    </div>
  );
}
