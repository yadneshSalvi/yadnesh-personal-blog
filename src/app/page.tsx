import { getAllPostsMeta } from "@/lib/posts";
import Hero from "@/components/Hero";
import BelowFold from "@/components/BelowFold";

export default function Home() {
  const posts = getAllPostsMeta();
  return (
    <>
      <Hero />
      <div className="h-px w-full bg-zinc-200/80 dark:bg-zinc-800/80" />
      <BelowFold posts={posts} />
    </>
  );
}
