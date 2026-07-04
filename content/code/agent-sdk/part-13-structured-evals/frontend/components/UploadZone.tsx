"use client";

import { useState } from "react";

// The drop zone: drag files onto it, or click it to browse (it's a label
// wrapping a hidden file input, so the click is free). It doesn't upload
// anything itself; it hands File objects to the page, which owns the
// workspace and the toasts.
export function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [over, setOver] = useState(false);

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
      className={`block w-full max-w-sm cursor-pointer rounded-xl border-2 border-dashed px-6 py-5 text-center text-sm transition-colors ${
        over
          ? "border-accent bg-accent/5 text-accent"
          : "border-stone-300 text-stone-500 hover:border-accent hover:text-accent dark:border-stone-700 dark:text-stone-400"
      }`}
    >
      Drop your CSVs here, or click to browse
      <input
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </label>
  );
}
