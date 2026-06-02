import { Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow, CopyToken } from "../SectionParts";

export function PPTTemplatesSection() {
  return (
    <SectionWrapper id="ppt-templates">
      <SectionHeader
        title={<>PPT <span className="text-primary">Templates</span></>}
        subtitle="Presentation decks follow the same data-noir aesthetic. This section provides slide-by-slide guidance, specs, and rules to ensure every Enfactum presentation communicates authority."
      />

      {/* How to build a deck */}
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6 mb-10">
        <p className="text-[14px] font-medium text-foreground mb-2">Deck Building Process</p>
        <ol className="space-y-2 text-[13px] text-text-secondary list-decimal list-inside">
          <li>Start with the <strong>question your audience has</strong> — not the features you want to show.</li>
          <li>Map the answer into 3-5 key points. Each point gets 1-2 slides maximum.</li>
          <li>Every slide must have one clear takeaway. If someone screenshots it, the message should be obvious.</li>
          <li>Use the slide templates below. Do not freestyle layouts.</li>
          <li>Always end with a clear CTA — never a "Thank You" slide.</li>
        </ol>
      </div>

      {/* Slide types */}
      <Eyebrow className="mb-2">Slide Templates — When to Use Each</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Six approved slide types. Every deck should use 2-3 of these. Never create a custom layout — adapt one of these.</p>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {[
          { type: "Title Slide", desc: "Centered wordmark above, subtitle in Body-Large (18px) below. Dark midnight background. Minimal — no more than 10 words.", when: "First slide of every deck. Also used as section dividers in long decks.", example: "Wordmark centered at 40% from top. Subtitle: 'Southeast Asia Market Intelligence · Q4 2025'" },
          { type: "Data Slide", desc: "Full-width chart with metrics in IBM Plex Mono. Max 3 KPIs per slide. Chart takes 70% of the slide.", when: "Presenting quantitative evidence: market data, performance metrics, comparisons.", example: "Left: bar chart of signal volume. Right column: 3 KPIs stacked — '2,847 Active Signals' / '↑12.4%' / '14 Markets'" },
          { type: "Content Slide", desc: "Left-aligned headline (32px Bold) with 1-2 Blue highlighted words. Right column: supporting visual or bullet points.", when: "Explaining a concept, feature, or strategy. The main narrative slides.", example: "Headline: 'Signal Density Beats Brand Awareness' (density in Blue). Right: 3 supporting bullets with icons." },
          { type: "Comparison Slide", desc: "Two-column layout with clear vertical divider. Headers in SemiBold. Content in body text.", when: "Before/after, competitor comparison, old way vs new way, problem vs solution.", example: "Left: 'Traditional GTM' (problems). Right: 'Enfactum Approach' (solutions). Blue header on right column." },
          { type: "Quote Slide", desc: "IBM Plex Serif italic pull quote, centered. Attribution below in Sans Regular. Dark midnight background.", when: "Client testimonial, market expert quote, founder statement. Max 1 per deck.", example: "'Signal density compressed our deal cycle from 90 to 28 days.' — VP Sales, Enterprise SaaS Client" },
          { type: "Closing Slide", desc: "Wordmark, clear CTA, and contact info. Same midnight background as title slide. Never a 'Thank You' slide.", when: "Final slide of every deck. Must have a specific next step.", example: "Wordmark → 'Schedule a Territory Mapping Session' → contact email → website URL" },
        ].map((s) => (
          <div key={s.type} className="bg-brand-midnight rounded-xl p-6 flex flex-col">
            <Eyebrow className="text-brand-neutral-400 mb-2">{s.type}</Eyebrow>
            <p className="text-[13px] text-brand-neutral-200 leading-relaxed mb-3">{s.desc}</p>
            <div className="mt-auto pt-3 border-t border-white/10">
              <Eyebrow className="text-brand-electric mb-1">When to Use</Eyebrow>
              <p className="text-[11px] text-brand-neutral-400 mb-2">{s.when}</p>
              <Eyebrow className="text-brand-emerald mb-1">Good Example</Eyebrow>
              <p className="text-[11px] text-brand-neutral-400">{s.example}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rules */}
      <Eyebrow className="mb-4">Presentation Rules</Eyebrow>
      <div className="grid grid-cols-2 gap-4">
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-emerald mb-3 flex items-center gap-2"><Check size={14} /> Do</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> <CopyToken value="16:9" className="text-[13px]" /> aspect ratio only — never 4:3</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Dark backgrounds (#0A0F1E) for all external-facing decks</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Maximum 6 lines of text per slide — if more, split into two</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Every data claim must have a source footnote (10px IBM Plex Sans Light)</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Animations: fade-in only at 300ms. No other transition types.</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> End with a specific CTA — never "Thank You" or "Questions?"</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-destructive mb-3 flex items-center gap-2"><X size={14} /> Don't</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Use 4:3 aspect ratio for any presentation</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Use light backgrounds for external decks (internal docs excepted)</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Use fly-in, bounce, spin, or slide transitions</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Include stock photography or generic clip art</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Create custom slide layouts outside the 6 templates</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Make data claims without sourcing</li>
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
