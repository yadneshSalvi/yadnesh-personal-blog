// src/lib/brief/topics.ts
//
// Hand-written topic descriptions. A topic page is indexed and listed in the
// brief sitemap only once it has one: an auto-generated list page with no
// editorial framing is exactly the thin content that plan 03 §3 keeps off this
// domain. Adding a description here is the act of promoting a topic page.

export const CURATED_TOPICS: Record<string, string> = {
  security:
    "Agent containment, sandbox escapes, prompt-injection surfaces, and the incident reports labs have started publishing. This is the topic the brief covers most closely, because it is where the gap between a demo and a deployment is widest.",
  "harnesses-tools":
    "The code around the model: tool access, context handling, subagent orchestration, and the harness-level features that increasingly decide what an agent can finish.",
  "evals-benchmarks":
    "How agent performance gets measured, and how the measurement keeps breaking. Contamination, infrastructure noise, and benchmarks that stop meaning what they meant.",
};

export function isCuratedTopic(topic: string): boolean {
  return topic in CURATED_TOPICS;
}
