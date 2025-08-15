"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export default function CalendarBooking() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "30min" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      {/* Header matching the contact form style */}
      <div className="border-b border-zinc-200 bg-zinc-50/70 px-4 py-2 text-xs uppercase tracking-wider text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1.5 rounded bg-gradient-to-b from-emerald-500 to-teal-400 opacity-70" />
          <span className="font-mono font-semibold">schedule meeting</span>
        </div>
      </div>

      {/* Calendar container */}
      <div className="p-4">
        <div className="space-y-3">
          <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            <p>// book a 30-minute slot</p>
            <p>/* let's sync up and build something awesome */</p>
          </div>
          
          <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-1 dark:border-zinc-700 dark:bg-zinc-900/50">
            <div className="min-h-[700px] overflow-auto rounded border border-zinc-200/50 bg-white dark:border-zinc-700/50 dark:bg-zinc-950">
              <Cal
                namespace="30min"
                calLink="yadnesh-salvi/30min"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "700px",
                  overflow: "scroll"
                }}
                config={{
                  layout: "month_view",
                  theme: "auto"
                }}
              />
            </div>
          </div>

          <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
            status: <span className="text-emerald-600 dark:text-emerald-400">calendar online</span> — 
            pick your preferred time slot
          </div>
        </div>
      </div>
    </div>
  );
}
