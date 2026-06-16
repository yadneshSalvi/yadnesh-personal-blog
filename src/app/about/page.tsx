import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, AUTHOR } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description:
    "Yadnesh Salvi — AI/ML Engineer in Mumbai. Five years shipping NLP, agents, and RAG systems. Trained at IISc Bangalore and IIT Delhi.",
  alternates: { canonical: "/about" },
};

const profileSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: AUTHOR.name,
    url: AUTHOR.url,
    jobTitle: AUTHOR.jobTitle,
    email: AUTHOR.email,
    sameAs: AUTHOR.sameAs,
    address: { "@type": "PostalAddress", addressLocality: "Mumbai", addressCountry: "IN" },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Indian Institute of Science (IISc), Bangalore" },
      { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology (IIT) Delhi" },
    ],
    knowsAbout: ["NLP", "Agentic AI", "LLMs", "RAG", "LangGraph", "FastAPI"],
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={profileSchema} />
      <AboutClient />
    </>
  );
}
