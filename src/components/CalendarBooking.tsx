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
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Thirty minutes, no agenda required — pick a slot that suits you.
      </p>

      <div className="min-h-[700px] overflow-auto rounded-sm border border-line">
        <Cal
          namespace="30min"
          calLink="yadnesh-salvi/30min"
          style={{
            width: "100%",
            height: "100%",
            minHeight: "700px",
            overflow: "scroll",
          }}
          config={{
            layout: "month_view",
            theme: "auto",
          }}
        />
      </div>
    </div>
  );
}
