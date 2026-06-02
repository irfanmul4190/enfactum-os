import { useState, useMemo, useEffect } from "react";
import { PenLine, Image, Layout, Code, Search, ArrowRight, Clock } from "lucide-react";
import { SectionWrapper, Eyebrow } from "../SectionParts";
import { getRecentlyCopied } from "../PromptCard";

interface TaskCard {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  tool: string;
  toolColor: string;
  subtitle: string;
  targetSection: string;
  targetPromptId: string;
}

const groups: { label: string; tasks: TaskCard[] }[] = [
  {
    label: "Marketing",
    tasks: [
      { icon: PenLine, iconColor: "text-primary", title: "Write a LinkedIn Post", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "Contrarian insight format", targetSection: "prompts-copy", targetPromptId: "prompt-linkedin-contrarian" },
      { icon: PenLine, iconColor: "text-primary", title: "Write a Cold Email", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "Signal-first outreach", targetSection: "prompts-copy", targetPromptId: "prompt-cold-email" },
      { icon: Image, iconColor: "text-brand-violet", title: "Generate a Hero Image", tool: "Midjourney", toolColor: "bg-brand-violet/15 text-brand-violet", subtitle: "Brand-correct visual", targetSection: "prompts-image", targetPromptId: "prompt-linkedin-hero-bg" },
      { icon: PenLine, iconColor: "text-primary", title: "Write Website Copy", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "Hero + subhead + CTA", targetSection: "prompts-copy", targetPromptId: "prompt-website-hero" },
    ],
  },
  {
    label: "Sales",
    tasks: [
      { icon: PenLine, iconColor: "text-primary", title: "Write a Proposal Intro", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "Data-led positioning", targetSection: "prompts-copy", targetPromptId: "prompt-proposal-intro" },
      { icon: PenLine, iconColor: "text-primary", title: "Draft Objection Response", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "Signal-backed rebuttal", targetSection: "prompts-copy", targetPromptId: "prompt-objection" },
      { icon: PenLine, iconColor: "text-primary", title: "Write a Cold LinkedIn DM", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "Personalized outreach", targetSection: "prompts-copy", targetPromptId: "prompt-linkedin-dm" },
      { icon: PenLine, iconColor: "text-primary", title: "Describe a Capability Pillar", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "Product feature framing", targetSection: "prompts-copy", targetPromptId: "prompt-capability-pillar" },
    ],
  },
  {
    label: "Design",
    tasks: [
      { icon: Layout, iconColor: "text-brand-emerald", title: "Build a UI Component", tool: "v0", toolColor: "bg-brand-emerald/15 text-brand-emerald", subtitle: "On-brand React component", targetSection: "prompts-design", targetPromptId: "prompt-kpi-card" },
      { icon: Image, iconColor: "text-brand-violet", title: "Generate Deck Background", tool: "Midjourney", toolColor: "bg-brand-violet/15 text-brand-violet", subtitle: "Midnight geometric", targetSection: "prompts-deck", targetPromptId: "prompt-deck-title-bg" },
      { icon: Image, iconColor: "text-brand-violet", title: "Create a Social Graphic", tool: "Gemini", toolColor: "bg-primary/15 text-primary", subtitle: "Data-noir aesthetic", targetSection: "prompts-image", targetPromptId: "prompt-social-square" },
      { icon: Image, iconColor: "text-brand-violet", title: "Generate Brand Imagery", tool: "Gemini", toolColor: "bg-primary/15 text-primary", subtitle: "Abstract geometric", targetSection: "prompts-image", targetPromptId: "prompt-gemini-foundation" },
    ],
  },
  {
    label: "Engineering",
    tasks: [
      { icon: Code, iconColor: "text-brand-amber", title: "Build a Metric Card", tool: "v0", toolColor: "bg-brand-emerald/15 text-brand-emerald", subtitle: "KPI display component", targetSection: "prompts-design", targetPromptId: "prompt-kpi-card" },
      { icon: Code, iconColor: "text-brand-amber", title: "Build a Data Table", tool: "v0", toolColor: "bg-brand-emerald/15 text-brand-emerald", subtitle: "Dense data grid", targetSection: "prompts-design", targetPromptId: "prompt-data-table" },
      { icon: Code, iconColor: "text-brand-amber", title: "Build Dashboard Layout", tool: "Lovable", toolColor: "bg-brand-emerald/15 text-brand-emerald", subtitle: "Full-page layout", targetSection: "prompts-design", targetPromptId: "prompt-dashboard" },
      { icon: Code, iconColor: "text-brand-amber", title: "Generate Token Config", tool: "Claude", toolColor: "bg-primary/15 text-primary", subtitle: "CSS custom properties", targetSection: "prompts-design", targetPromptId: "prompt-color-token" },
    ],
  },
];

// All prompts for search across vault sections
const allPrompts = [
  { id: "prompt-cold-email", title: "Write a Cold Outreach Email", tool: "Claude", section: "prompts-copy", keywords: "cold email outbound sales SDR" },
  { id: "prompt-objection", title: "Draft an Objection Response", tool: "Claude", section: "prompts-copy", keywords: "objection sales pushback rebuttal" },
  { id: "prompt-linkedin-dm", title: "Write a Cold LinkedIn DM", tool: "Claude", section: "prompts-copy", keywords: "LinkedIn DM message outreach" },
  { id: "prompt-linkedin-contrarian", title: "Write a LinkedIn Post — Contrarian Insight", tool: "Claude", section: "prompts-copy", keywords: "LinkedIn post social contrarian" },
  { id: "prompt-website-hero", title: "Write Website Hero Copy", tool: "Claude", section: "prompts-copy", keywords: "website hero landing page copy headline CTA" },
  { id: "prompt-proposal-intro", title: "Write a Proposal Introduction", tool: "Claude", section: "prompts-copy", keywords: "proposal intro SOW sales" },
  { id: "prompt-capability-pillar", title: "Describe a Capability Pillar", tool: "Claude", section: "prompts-copy", keywords: "capability pillar product description" },
  { id: "prompt-linkedin-hero-bg", title: "LinkedIn Post Background — Geometric Dark", tool: "Midjourney", section: "prompts-image", keywords: "LinkedIn hero background image geometric" },
  { id: "prompt-event-backdrop", title: "Event Backdrop — Scale & Authority", tool: "Midjourney", section: "prompts-image", keywords: "event conference backdrop stage" },
  { id: "prompt-social-square", title: "Social Media Square — Data Grid", tool: "Midjourney", section: "prompts-image", keywords: "social media square Instagram grid" },
  { id: "prompt-data-report-bg", title: "Data Report Background", tool: "Ideogram", section: "prompts-image", keywords: "data report infographic background" },
  { id: "prompt-territory-map", title: "Territory Map Visual", tool: "Ideogram", section: "prompts-image", keywords: "territory map SEA Southeast Asia" },
  { id: "prompt-gemini-foundation", title: "The Foundation — Data & Structure", tool: "Gemini", section: "prompts-image", keywords: "foundation data structure hero geometric cubes" },
  { id: "prompt-gemini-pathway", title: "The Pathway — Strategy & Flow", tool: "Gemini", section: "prompts-image", keywords: "pathway strategy flow process lines" },
  { id: "prompt-gemini-monument", title: "The Monument — Scale & Authority", tool: "Gemini", section: "prompts-image", keywords: "monument scale authority brutalist keynote" },
  { id: "prompt-blog-header", title: "Blog Post Header Image", tool: "DALL-E", section: "prompts-image", keywords: "blog header newsletter banner content" },
  { id: "prompt-kpi-card", title: "Build a KPI Metric Card", tool: "v0", section: "prompts-design", keywords: "KPI metric card dashboard widget" },
  { id: "prompt-data-table", title: "Build a Dense Data Table", tool: "v0", section: "prompts-design", keywords: "data table grid dense signal feed" },
  { id: "prompt-dashboard", title: "Build a Full Dashboard Layout", tool: "Lovable", section: "prompts-design", keywords: "dashboard layout page admin" },
  { id: "prompt-color-token", title: "Generate Color Token Config", tool: "Claude", section: "prompts-design", keywords: "color token CSS config theme" },
  { id: "prompt-motion-token", title: "Generate Motion Token CSS", tool: "Claude", section: "prompts-design", keywords: "motion animation easing duration token" },
  { id: "prompt-pitch-deck", title: "Generate a Full Pitch Deck", tool: "Gamma", section: "prompts-deck", keywords: "pitch deck investor presentation slides" },
  { id: "prompt-speaker-notes", title: "Write Slide-by-Slide Speaker Notes", tool: "Claude", section: "prompts-deck", keywords: "speaker notes presentation talking points" },
  { id: "prompt-deck-title-bg", title: "Deck Title Slide Background", tool: "Midjourney", section: "prompts-deck", keywords: "deck title slide background image" },
  { id: "prompt-deck-data-bg", title: "Data Slide Background", tool: "Midjourney", section: "prompts-deck", keywords: "data slide background subtle dark" },
  { id: "prompt-voice-audit", title: "Full Brand Voice Audit", tool: "Claude", section: "prompts-compliance", keywords: "brand voice audit compliance check copy" },
  { id: "prompt-color-audit", title: "Audit Copy for Color Reference Violations", tool: "Claude", section: "prompts-compliance", keywords: "color reference audit violations" },
  { id: "prompt-design-compliance", title: "Design Spec Compliance Check", tool: "Claude", section: "prompts-compliance", keywords: "design spec compliance typography color motion" },
  { id: "prompt-deck-preflight", title: "Deck Pre-Flight Check", tool: "Claude", section: "prompts-compliance", keywords: "deck presentation preflight compliance slides" },
];

const popular = [
  { title: "LinkedIn Contrarian Post", tool: "Claude", targetPromptId: "prompt-linkedin-contrarian" },
  { title: "Hero Background Image", tool: "Midjourney", targetPromptId: "prompt-linkedin-hero-bg" },
  { title: "Brand Compliance Check", tool: "Claude", targetPromptId: "prompt-voice-audit" },
];

interface QuickCreateProps {
  onNavigate: (id: string) => void;
}

export function QuickCreateSection({ onNavigate }: QuickCreateProps) {
  const [search, setSearch] = useState("");
  const [recentCopied, setRecentCopied] = useState(getRecentlyCopied());

  useEffect(() => {
    function update() { setRecentCopied(getRecentlyCopied()); }
    window.addEventListener("recent-copied-updated", update);
    return () => window.removeEventListener("recent-copied-updated", update);
  }, []);

  const handleTaskClick = (targetPromptId: string) => {
    const el = document.getElementById(targetPromptId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("prompt-pulse", { detail: targetPromptId }));
      }, 400);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        tasks: g.tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.subtitle.toLowerCase().includes(q) ||
            t.tool.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.tasks.length > 0);
  }, [search]);

  const searchedPrompts = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allPrompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tool.toLowerCase().includes(q) ||
        p.keywords.toLowerCase().includes(q)
    );
  }, [search]);

  const totalFiltered = search.trim()
    ? filteredGroups.reduce((sum, g) => sum + g.tasks.length, 0) + searchedPrompts.length
    : 0;

  return (
    <SectionWrapper id="quick-create">
      <div className="mb-10">
        <h1 className="text-[38px] font-bold leading-tight text-foreground">
          What do you want to <span className="text-primary">create</span>?
        </h1>
        <p className="mt-3 text-[16px] text-text-secondary leading-relaxed max-w-[720px]">
          Pick a task. Get the exact prompt. Produce on-brand work in 60 seconds.
        </p>
      </div>

      {/* Search */}
      <div className="mb-10">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts — e.g. LinkedIn post, hero image, cold email..."
            className="w-full h-12 pl-11 pr-4 rounded-[10px] bg-card border-2 border-border text-[14px] text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors duration-200"
            style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </div>
        {search.trim() && (
          <p className="mt-2 text-[12px] font-mono-data text-muted">
            {totalFiltered} prompt{totalFiltered !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Prompt search results */}
      {search.trim() && searchedPrompts.length > 0 && (
        <div className="mb-8">
          <Eyebrow className="mb-3">Matching Prompts</Eyebrow>
          <div className="space-y-2">
            {searchedPrompts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleTaskClick(p.id)}
                className="w-full brand-card px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary">{p.tool}</span>
                  <span className="text-[13px] font-medium text-foreground">{p.title}</span>
                </div>
                <ArrowRight size={14} className="text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task grid */}
      {filteredGroups.map((group) => (
        <div key={group.label} className="mb-8">
          <Eyebrow className="mb-3">{group.label}</Eyebrow>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {group.tasks.map((task) => (
              <button
                key={task.title}
                onClick={() => handleTaskClick(task.targetPromptId)}
                className="brand-card p-5 text-left group cursor-pointer"
              >
                <task.icon size={24} className={`${task.iconColor} mb-3`} />
                <div className="text-[15px] font-semibold text-foreground mb-1.5">{task.title}</div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${task.toolColor}`}>
                    {task.tool}
                  </span>
                </div>
                <div className="text-[12px] text-muted">{task.subtitle}</div>
                <ArrowRight size={14} className="mt-2 text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Recently Copied */}
      {recentCopied.length > 0 && (
        <div className="mb-8">
          <Eyebrow className="mb-3 flex items-center gap-1.5">
            <Clock size={12} />
            Recently Copied
          </Eyebrow>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentCopied.map((r) => (
              <button
                key={r.id}
                onClick={() => handleTaskClick(r.id)}
                className="shrink-0 brand-card px-4 py-3 flex items-center gap-3"
              >
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary">{r.tool}</span>
                <span className="text-[13px] font-medium text-foreground">{r.title}</span>
                <ArrowRight size={14} className="text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular */}
      <Eyebrow className="mb-3">Popular This Week</Eyebrow>
      <div className="flex flex-wrap gap-3 pb-2">
        {popular.map((p) => (
          <button
            key={p.title}
            onClick={() => handleTaskClick(p.targetPromptId)}
            className="shrink-0 brand-card px-4 py-3 flex items-center gap-3"
          >
            <div className="text-[13px] font-medium text-foreground">{p.title}</div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary">{p.tool}</span>
            <ArrowRight size={14} className="text-muted" />
          </button>
        ))}
      </div>
    </SectionWrapper>
  );
}
