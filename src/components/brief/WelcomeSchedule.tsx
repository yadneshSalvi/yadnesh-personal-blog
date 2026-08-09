"use client";

import { useSearchParams } from "next/navigation";
import { isCadence } from "@/lib/brief/cadence";

const LINES: Record<string, string> = {
  daily:
    "Weekdays at 8:45am IST. One lead story, six to nine items, about four minutes.",
  weekly:
    "Sundays at 9am IST. One argued synthesis of the week, about six minutes.",
  both:
    "Weekdays at 8:45am IST, about four minutes. Sundays at 9am IST, about six minutes.",
};

/** Prints the schedule the reader actually chose, when the redirect carries it. */
export default function WelcomeSchedule() {
  const cadence = useSearchParams().get("cadence");
  const line = isCadence(cadence) ? LINES[cadence] : LINES.both;
  return <p>{line}</p>;
}
