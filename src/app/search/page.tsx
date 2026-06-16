import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Search essays and field notes on AI engineering.",
  robots: { index: false, follow: true }, // keep out of the index; still follow links
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return <SearchClient />;
}
