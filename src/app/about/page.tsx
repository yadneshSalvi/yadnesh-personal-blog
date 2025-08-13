"use client";

import type { ComponentType, SVGProps, ReactNode } from "react";
import { useState } from "react";

export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 bg-clip-text text-transparent dark:from-zinc-100 dark:via-zinc-400 dark:to-zinc-100">
              Yadnesh Salvi
            </span>
          </h1>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <ContactItem href="https://github.com/yadneshSalvi" label="yadneshSalvi" Icon={GitHubIcon} />
              <ContactItem href="https://www.linkedin.com/in/yadnesh-salvi-bb5151ba" label="LinkedIn" Icon={LinkedInIcon} />
              <ContactItem href="https://x.com/yadnesh_sa88965" label="Twitter" Icon={XIcon} />
            </div>
            <div className="flex flex-wrap gap-2">
              <ContactBadge label="(+91) 9971733565" Icon={PhoneIcon} />
              <ContactBadge label="yadneshujwal@gmail.com" Icon={MailIcon} />
              <ContactBadge label="Mumbai, Maharashtra, India" Icon={PinIcon} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <Card>
            <SectionTitle Icon={SparklesIcon} title="Summary" />
            <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              AI/ML Engineer with expertise in NLP, Agentic AI, LLMs, and RAG systems. Proven track record of implementing production-scale AI solutions that reduce costs and accelerate business processes. Passionate about translating AI research into practical applications.
            </p>
          </Card>

          <Card>
            <SectionTitle Icon={BriefcaseIcon} title="Professional Experience" />
            <div className="space-y-6">
              <TimelineItem
                role="Senior Data Scientist"
                company="ContractPodAI"
                location="Mumbai"
                period="Jul 2021 – Present"
              >
                <ExpandableSection title="Legal Deep Research AI Agent">
                  <Bullet>Built an end-to-end AI agent enabling legal teams to query hundreds of thousands of legal documents.</Bullet>
                  <Bullet>Implemented a scalable document ingestion pipeline with intelligent chunking, vectorization, and metadata extraction.</Bullet>
                  <Bullet>Developed core agent logic with LangGraph: query clarification, metadata-driven search space reduction, parallelized sub-query execution, and answer validation. Initiated front-end POC with CopilotKit in React.</Bullet>
                </ExpandableSection>

                <ExpandableSection title="Legal Contract Review with GenAI">
                  <Bullet>Reduced contract review time from days to minutes via AI-powered workflow.</Bullet>
                  <Bullet>Architected system with FastAPI, LangChain, MongoDB, Qdrant, and Azure Functions.</Bullet>
                  <Bullet>Improved redlining accuracy by 60%+ with advanced RAG compared to naive prompting.</Bullet>
                  <Bullet>Created custom evaluation datasets using CUAD and LangSmith to measure RAG accuracy.</Bullet>
                  <Bullet>Built comprehensive LLM interaction logging for faster hallucination troubleshooting.</Bullet>
                  <Bullet>Hardened CI with automated code quality checks and extensive pytest coverage.</Bullet>
                </ExpandableSection>

                <ExpandableSection title="Information Extraction and Summarization">
                  <Bullet>Delivered scalable extraction and concise summarization for legal research with precise citations linking to exact source locations.</Bullet>
                  <Bullet>Optimized responsiveness with asyncio and LangChain CallbackHandlers to stream diverse data formats.</Bullet>
                  <Bullet>Reduced summarization latency by 70%+ using asynchronous map-reduce.</Bullet>
                  <Bullet>Fine-tuned Llama-3 8B and GPT-4o on custom datasets; served at scale with vLLM on A100 GPUs (GCP).</Bullet>
                </ExpandableSection>

                <ExpandableSection title="Clause Identification and Risk Analysis">
                  <Bullet>Achieved 85%+ clause extraction accuracy by fine-tuning BERT for multi-label sentence classification.</Bullet>
                  <Bullet>Performed risk analysis by comparing extracted clauses to preset clauses with 80%+ accuracy using sentence-transformer architecture minimizing cosine similarity loss.</Bullet>
                  <Bullet>Used MLflow for experiment tracking, hyperparameter optimization, and artifact management across BERT fine-tuning.</Bullet>
                </ExpandableSection>
              </TimelineItem>

              <TimelineItem
                role="Data Scientist Intern"
                company="Airtel"
                location="Gurgaon"
                period="May 2020 – Jun 2020"
                collapsible
              >
                <ul className="list-disc pl-5 text-sm">
                  <Bullet>Built multivariate time-series forecasting to predict 4G data usage volume for network planning.</Bullet>
                  <Bullet>Trained decision-tree and XGBoost models using network statistics for mobile tower anomaly detection.</Bullet>
                </ul>
              </TimelineItem>

              <TimelineItem
                role="Full Stack Developer (Freelance)"
                company="Go Jain Yatra"
                location="Mumbai"
                period="May 2018 – Jul 2019"
                collapsible
              >
                <ul className="list-disc pl-5 text-sm">
                  <Bullet>Designed, developed, and deployed a booking website for Jain Dharamshalas using Django, Bootstrap, and PostgreSQL.</Bullet>
                </ul>
              </TimelineItem>
            </div>
          </Card>

          <Card>
            <SectionTitle Icon={FlaskIcon} title="Academic & Personal Projects" />
            <div className="space-y-5">
              <Project
                title="Agentic RAG using LangGraph"
                period="May 2024 – Jul 2024"
                bullets={[
                  "Implemented multi-agent Supervisor–Assistant architecture using LangGraph; UI with Chainlit.",
                  "Created SQL agent for multi-table queries, Chart agent for plotting, and Report agent for document generation.",
                ]}
              />
              <Project
                title="Automate short-form content creation with AI"
                period="Sep 2023 – Dec 2023"
                bullets={[
                  "Automated short video creation using LLMs for scripts, Stable Diffusion for images, TTS + voice cloning for audio, and Whisper for subtitles.",
                ]}
              />
              <Project
                title="GCN for Text Classification"
                period="Oct 2020 – Jan 2021"
                bullets={[
                  "Framed text classification as node/graph classification via GCN; achieved 96.8% (R8), 92% (R52), 76.6% (Movie Review).",
                ]}
              />
            </div>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <SectionTitle Icon={GraduationIcon} title="Education" />
            <div className="space-y-4 text-sm">
              <EduItem degree="M.Tech, Computer Science" org="Indian Institute of Science (IISc), Bangalore" period="Aug 2019 – Jun 2021" />
              <EduItem degree="B.Tech, Engineering Physics" org="Indian Institute of Technology (IIT) Delhi" period="Aug 2014 – Jun 2018" />
            </div>
          </Card>

          <Card>
            <SectionTitle Icon={CpuIcon} title="Skills" />
            <div className="space-y-4">
              <SkillGroup title="Languages, DBs & Cloud" items={["Python", "JavaScript", "TypeScript", "C++", "SQL", "MongoDB", "Qdrant", "Pinecone", "AWS", "GCP", "Azure"]} />
              <SkillGroup title="Libraries & Tools" items={["FastAPI", "Flask", "LangGraph", "TensorFlow", "PyTorch", "MLflow", "Docker", "React", "Tailwind", "shadcn", "Git"]} />
            </div>
          </Card>

          <Card>
            <SectionTitle Icon={TrophyIcon} title="Awards" />
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><TrophyMini className="mt-0.5" /><span><span className="font-medium">GATE (CS) 2019</span>: All-India percentile 99.78</span></li>
              <li className="flex items-start gap-2"><TrophyMini className="mt-0.5" /><span><span className="font-medium">SHE Scholarship</span>: Top 1% in School Board (Class XII), 2014</span></li>
            </ul>
          </Card>
        </aside>
      </div>
      <div className="mt-8">
        <a
          href="/YadneshSalviDataScientistResume.pdf"
          download
          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          <DownloadIcon className="h-4 w-4" />
          <span>Download Resume (PDF)</span>
        </a>
      </div>
    </main>
  );
}


type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50">
      {children}
    </div>
  );
}

function SectionTitle({ Icon, title }: { Icon: ComponentType<IconProps>; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-zinc-500" />
      <h2 className="text-sm font-semibold tracking-wide text-zinc-800 dark:text-zinc-200">{title}</h2>
    </div>
  );
}

function ContactItem({ href, label, Icon }: { href: string; label: string; Icon: ComponentType<IconProps> }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white/70 px-2 py-1 text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </a>
  );
}

function ContactBadge({ label, Icon }: { label: string; Icon: ComponentType<IconProps> }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white/70 px-2 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </span>
  );
}

function TimelineItem({ role, company, location, period, children, collapsible = false }: { role: string; company: string; location: string; period: string; children: ReactNode; collapsible?: boolean }) {
  const [open, setOpen] = useState(false);
  const left = (
    <div className="flex items-center gap-2">
      {collapsible && (
        <ChevronIcon className={`h-3 w-3 transition-transform ${open ? "rotate-90" : "rotate-0"}`} />
      )}
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{role}</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{company} • {location}</p>
      </div>
    </div>
  );
  return (
    <div className="relative rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="group inline-flex items-center gap-2 text-left"
          >
            {left}
          </button>
        ) : (
          left
        )}
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{period}</span>
      </div>
      {(!collapsible || open) && (
        <div className="prose prose-sm dark:prose-invert">
          {children}
        </div>
      )}
    </div>
  );
}

function Subsection({ title }: { title: string }) {
  return <h4 className="mt-3 text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{title}</h4>;
}

function Bullet({ children }: { children: ReactNode }) {
  return <li className="leading-6">{children}</li>;
}

function Project({ title, period, bullets }: { title: string; period: string; bullets: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-1 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group inline-flex items-center gap-2 text-left"
        >
          <ChevronIcon className={`h-3 w-3 transition-transform ${open ? "rotate-90" : "rotate-0"}`} />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
        </button>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{period}</span>
      </div>
      {open && (
        <ul className="list-disc pl-5 text-sm">
          {bullets.map((b, i) => (
            <li key={i} className="leading-6">{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExpandableSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group inline-flex items-center gap-2 rounded-md px-1 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      >
        <ChevronIcon className={`h-3 w-3 transition-transform ${open ? "rotate-90" : "rotate-0"}`} />
        <h4 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{title}</h4>
      </button>
      {open && (
        <ul className="mt-1 list-disc pl-5 text-sm">
          {children}
        </ul>
      )}
    </div>
  );
}

function EduItem({ degree, org, period }: { degree: string; org: string; period: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{degree}</p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">{org}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">{period}</p>
    </div>
  );
}

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">{i}</span>
        ))}
      </div>
    </div>
  );
}

function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h1.125a2.25 2.25 0 0 0 2.25-2.25v-2.1a1.125 1.125 0 0 0-1.03-1.12l-3.9-.433a1.125 1.125 0 0 0-1.01.57l-.87 1.51a.75.75 0 0 1-.82.36 12.04 12.04 0 0 1-7.28-7.28.75.75 0 0 1 .36-.82l1.51-.87c.3-.173.48-.5.57-1.01l-.433-3.9A1.125 1.125 0 0 0 8.6 2.25h-2.1A2.25 2.25 0 0 0 4.25 4.5z" />
    </svg>
  );
}

function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M3 5.25h18A1.75 1.75 0 0 1 22.75 7v10A1.75 1.75 0 0 1 21 18.75H3A1.75 1.75 0 0 1 1.25 17V7A1.75 1.75 0 0 1 3 5.25z" />
      <path d="m3 7 8.357 5.571a1.25 1.25 0 0 0 1.286 0L21 7" />
    </svg>
  );
}

function PinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 21s-6.75-6.135-6.75-10.5A6.75 6.75 0 0 1 12 3.75a6.75 6.75 0 0 1 6.75 6.75C18.75 14.865 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.25" />
    </svg>
  );
}

function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c-5.523 0-10 4.477-10 10 0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.342-3.369-1.342-.455-1.156-1.111-1.464-1.111-1.464-.909-.62.069-.607.069-.607 1.004.071 1.532 1.032 1.532 1.032.893 1.53 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.337-2.22-.252-4.555-1.11-4.555-4.944 0-1.091.39-1.984 1.029-2.684-.103-.253-.446-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.203 2.393.1 2.646.64.7 1.028 1.593 1.028 2.684 0 3.842-2.339 4.689-4.566 4.936.36.31.68.92.68 1.855 0 1.338-.012 2.418-.012 2.747 0 .267.18.577.688.479C19.138 20.164 22 16.417 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.3 8.5h4.4V24H.3V8.5zM8.7 8.5h4.216v2.108h.061c.588-1.117 2.026-2.296 4.17-2.296 4.458 0 5.279 2.936 5.279 6.754V24H18.02v-6.931c0-1.653-.03-3.777-2.303-3.777-2.306 0-2.659 1.799-2.659 3.658V24H8.7V8.5z" />
    </svg>
  );
}

function BriefcaseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M9 6.75V6a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3v.75" />
      <rect x="2.25" y="6.75" width="19.5" height="13.5" rx="2" />
      <path d="M2.25 12h19.5" />
    </svg>
  );
}

function SparklesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 3l1.8 3.9L18 8.7l-3.6 1.2L12 14l-1.8-4.1L6 8.7l4.2-1.8L12 3z" />
      <path d="M5 16l.9 2 2 .9-2 .9L5 22l-.9-2-2-.9 2-.9L5 16zM18 12l.6 1.4 1.4.6-1.4.6L18 16l-.6-1.4-1.4-.6 1.4-.6L18 12z" />
    </svg>
  );
}

function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M7 5l6 5-6 5" />
    </svg>
  );
}

function FlaskIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M9 2.25h6" />
      <path d="M10.5 2.25v5.25L4.8 17.4a4.5 4.5 0 0 0 3.9 6.6h6.6a4.5 4.5 0 0 0 3.9-6.6L13.5 7.5V2.25" />
      <path d="M8 12h8" />
    </svg>
  );
}

function GraduationIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="m12 3 10 5-10 5L2 8l10-5z" />
      <path d="M7 12v5a5 5 0 0 0 10 0v-5" />
    </svg>
  );
}

function CpuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M12 6V2M12 22v-4M6 12H2m20 0h-4M8 2v3m8-3v3M8 22v-3m8 3v-3M2 8h3M2 16h3m17-8h-3m3 8h-3" />
    </svg>
  );
}

function TrophyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M8 21h8M9 17h6" />
      <path d="M17 4H7a1 1 0 0 0-1 1v3a6 6 0 1 0 12 0V5a1 1 0 0 0-1-1z" />
      <path d="M5 7H4a3 3 0 0 1-3-3V3h3M19 7h1a3 3 0 0 0 3-3V3h-3" />
    </svg>
  );
}

function TrophyMini(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M6 17h8M7 14h6" />
      <path d="M15 4H5v2a5 5 0 1 0 10 0V4z" />
      <path d="M4 6H3a2 2 0 0 1-2-2V3h3M16 6h1a2 2 0 0 0 2-2V3h-3" />
    </svg>
  );
}

function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 3h3.9l5.4 7.6L18.6 3H22l-7.8 10.8L22 21h-3.9l-6-8.4L5.4 21H2l8.3-11.4L3 3z" />
    </svg>
  );
}

function DownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <rect x="3" y="18" width="18" height="3" rx="1" />
    </svg>
  );
}

