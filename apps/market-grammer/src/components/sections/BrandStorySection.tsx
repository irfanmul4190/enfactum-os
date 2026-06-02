import { Grid3x3, Target, MapPin, Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow, CopyToken } from "../SectionParts";

export function BrandStorySection() {
  return (
    <SectionWrapper id="brand-story">
      <SectionHeader
        title={<>Brand <span className="text-primary">Story</span></>}
        subtitle="Enfactum exists because Southeast Asia's markets don't move like Western playbooks say they should. This section defines who we are, what we believe, and how to communicate our positioning."
      />

      {/* THE ORIGIN */}
      <div className="mb-10">
        <Eyebrow className="mb-4">The Origin</Eyebrow>
        <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6">
          <p className="text-[15px] leading-relaxed text-text-secondary">
            Most GTM tools were built for US enterprise markets — linear funnels, single-language outreach, predictable buyer cycles. Southeast Asia has none of that. 14 markets. 6 dominant languages. Compressed deal cycles. Buyers who do 90% of their research before talking to sales. Enfactum was built for this reality.
          </p>
        </div>
      </div>

      {/* THREE TRUTHS */}
      <div className="mb-10">
        <Eyebrow className="mb-4">Three Truths — Our Design Principles</Eyebrow>
        <p className="text-[13px] text-text-secondary mb-4">
          Every design decision, piece of copy, and product feature must pass through at least one of these filters. When in doubt, ask: "Does this reinforce density, precision, or locality?"
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: Grid3x3,
              bg: "rgba(0,87,255,0.1)",
              color: "#0057FF",
              title: "Density is Clarity",
              body: "Information-rich layouts signal intelligence, not overwhelm. Whitespace is earned, not given. Every empty pixel must justify itself.",
              howTo: "Pack more data per screen than competitors. Use compact spacing, multi-column layouts, and nested data tables. Never add padding 'for aesthetics' — add it for scanability.",
              example: "Dashboard showing 6 KPIs + territory map + signal feed in a single viewport.",
            },
            {
              icon: Target,
              bg: "rgba(124,58,237,0.1)",
              color: "#7C3AED",
              title: "Precision is Trust",
              body: "Every pixel, weight, and token is deliberate. Craft communicates competence before words do. Inconsistency is the enemy of authority in B2B.",
              howTo: "Audit every element for alignment, consistent spacing tokens, and correct font weights. Never eyeball — use the design system values exactly.",
              example: "Metric card: number in Plex Mono 48px SemiBold, label in Plex Sans 12px Regular, delta in 12px Mono with ↑ glyph.",
            },
            {
              icon: MapPin,
              bg: "rgba(5,150,105,0.1)",
              color: "#059669",
              title: "Locality is Advantage",
              body: "SEA's multi-script modernity, urban density, and tropical data-noir are our aesthetic source code. No Western design reference applies.",
              howTo: "Always render local scripts natively. Reference tropical urban architecture (Singapore HDB, Bangkok BTS) rather than Silicon Valley minimalism.",
              example: "Landing page hero showing Thai + English in parallel columns, both at full typographic fidelity.",
            },
          ].map((card) => (
            <div key={card.title} className="brand-card p-5">
              <div
                className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-4"
                style={{ backgroundColor: card.bg }}
              >
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <h4 className="text-[15px] font-semibold text-foreground mb-2">{card.title}</h4>
              <p className="text-[13px] leading-relaxed text-text-secondary mb-3">{card.body}</p>
              <div className="border-t border-border pt-3 mt-3">
                <Eyebrow className="text-primary mb-1.5">How to Apply</Eyebrow>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-2">{card.howTo}</p>
                <Eyebrow className="text-brand-emerald mb-1">Good Example</Eyebrow>
                <p className="text-[12px] text-text-secondary italic">{card.example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POSITIONING */}
      <div className="mb-10">
        <Eyebrow className="mb-4">Positioning Statement</Eyebrow>
        <div className="bg-brand-midnight rounded-xl p-10 text-center mb-6">
          <p className="text-2xl font-bold text-white leading-relaxed">
            "The Growth Terminal of SEA GTM.{" "}
            <span className="text-brand-electric">Dense. Precise. Locally fluent.</span>"
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="brand-card p-5">
            <Eyebrow className="text-brand-emerald mb-3">How to Use This Tagline</Eyebrow>
            <ul className="space-y-2 text-[13px] text-text-secondary">
              <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Use on website hero, pitch deck title slide, and LinkedIn banner</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Acceptable to use the three-word version alone: "Dense. Precise. Locally fluent."</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Always set the three-word tagline in Electric Blue when on dark backgrounds</li>
              <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> The "Bloomberg Terminal" comparison is for internal framing — use sparingly externally</li>
            </ul>
          </div>
          <div className="brand-card p-5">
            <Eyebrow className="text-destructive mb-3">Don't</Eyebrow>
            <ul className="space-y-2 text-[13px] text-text-secondary">
              <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never modify the tagline wording (e.g., "Precise. Dense. Local.")</li>
              <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never use on light backgrounds without the full brand treatment</li>
              <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never pair with clip art, stock photos, or non-brand imagery</li>
              <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never translate the tagline — always use English</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Elevator Pitches */}
      <Eyebrow className="mb-4">Elevator Pitches — By Audience</Eyebrow>
      <div className="grid grid-cols-1 gap-3">
        {[
          { audience: "VC / Investor", pitch: "Enfactum is the market intelligence infrastructure for B2B companies expanding into Southeast Asia. We process signals across 14 markets in 6 languages to compress deal cycles and increase win rates by 3.2x." },
          { audience: "Enterprise Buyer (CMO/CRO)", pitch: "Your current GTM tools were built for single-market, single-language sales. Enfactum captures buying signals across every SEA market simultaneously — so your team spends time closing, not translating." },
          { audience: "Technical Buyer (RevOps)", pitch: "Enfactum ingests multi-language intent signals, maps them to territory architecture, and feeds your CRM with scored leads in under 200ms. One API. 14 markets. Zero manual translation." },
        ].map((p) => (
          <div key={p.audience} className="brand-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/15 text-primary">{p.audience}</span>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed italic">"{p.pitch}"</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
