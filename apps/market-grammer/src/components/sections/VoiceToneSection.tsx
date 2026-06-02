import { Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";

export function VoiceToneSection() {
  return (
    <SectionWrapper id="voice-tone">
      <SectionHeader
        title={<><span className="text-primary">Voice</span> &amp; Tone</>}
        subtitle="Authoritative but never arrogant. Precise but never clinical. Locally fluent but globally legible. Data-dense but never inaccessible. This section defines how Enfactum speaks in every context."
      />

      {/* Pull quote */}
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6 mb-10">
        <p className="text-lg font-medium text-foreground leading-relaxed">
          "We communicate the complexity of Asian markets with data-noir precision. We build the pipeline, we don't add to the noise."
        </p>
      </div>

      {/* Three registers */}
      <Eyebrow className="mb-2">Three Registers</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">
        Every piece of Enfactum copy falls into one of three registers. Before writing, identify your register — then use its rules consistently throughout the piece.
      </p>
      <div className="grid grid-cols-1 gap-4 mb-10">
        {[
          {
            register: "Authority",
            when: "Thought leadership, keynotes, brand statements, website hero copy, investor decks",
            tone: "Bold, declarative, forward-looking. Short punchy sentences. Lead with contrarian insight.",
            good: "\"Southeast Asia's GTM infrastructure was built on assumptions that never applied. Enfactum replaces assumptions with signals.\"",
            bad: "\"We are proud to announce our innovative solution for the exciting Southeast Asian market opportunity.\"",
            whyBad: "Vague superlatives, passive construction, no data, corporate boilerplate",
          },
          {
            register: "Precision",
            when: "Product UI, documentation, sales decks, case studies, data reports",
            tone: "Factual, specific, evidence-backed. Every number cited. No hedging or qualifiers.",
            good: "\"Signal captures across 14 markets in 6 languages, processed in under 200ms. 3.2x improvement in lead-to-close ratio.\"",
            bad: "\"Our powerful platform helps companies across many markets with various language capabilities to significantly improve results.\"",
            whyBad: "No specifics, filler adjectives ('powerful', 'various', 'significantly')",
          },
          {
            register: "Clarity",
            when: "Support docs, onboarding flows, internal comms, error messages, tooltips",
            tone: "Helpful, concise, action-oriented. Tell the user exactly what happened and what to do next.",
            good: "\"Your territory map updates every 4 hours. Here's what changed: 3 new signals in Jakarta, 1 lead scored above threshold in Bangkok.\"",
            bad: "\"Please note that the system periodically refreshes data. Changes may have occurred in your configured regions.\"",
            whyBad: "Passive, vague, doesn't tell the user anything useful",
          },
        ].map((r) => (
          <div key={r.register} className="brand-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/15 text-primary">{r.register}</span>
              <span className="text-[12px] text-muted">{r.when}</span>
            </div>
            <p className="text-[13px] text-text-secondary mb-3">{r.tone}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Eyebrow className="text-brand-emerald mb-2">✓ Good Example</Eyebrow>
                <p className="text-[13px] text-foreground italic leading-relaxed">{r.good}</p>
              </div>
              <div>
                <Eyebrow className="text-destructive mb-2">✗ Bad Example</Eyebrow>
                <p className="text-[13px] text-muted italic leading-relaxed line-through decoration-1">{r.bad}</p>
                <p className="text-[11px] text-destructive mt-1">{r.whyBad}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Writing principles */}
      <Eyebrow className="mb-2">Writing Principles</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Apply these rules to every piece of copy, regardless of register.</p>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {[
          { title: "Lead with Data", body: "Numbers first, narrative second. Every claim earns its place with evidence.", example: "✓ \"2,400 deal cycles analyzed\" not \"We analyzed many deals\"" },
          { title: "No Jargon Without Context", body: "If a term needs a glossary, define it inline. Never assume shared vocabulary.", example: "✓ \"Signal density (the volume of buying signals per market)\" not just \"Signal density\"" },
          { title: "Short Sentences Win", body: "Max 20 words per sentence in product copy. Complexity lives in the data, not the grammar.", example: "✓ \"14 markets. 6 languages. 200ms.\" not \"Our platform covers fourteen different markets across six languages with sub-200-millisecond processing times.\"" },
          { title: "Active Voice Always", body: "The subject does the action. Never let the action happen to the subject.", example: "✓ \"The system processes signals\" not \"Signals are processed by the system\"" },
          { title: "Avoid Superlatives", body: "Never say \"best\", \"leading\", \"innovative\", \"cutting-edge\", or \"world-class\". Let the data speak.", example: "✓ \"3.2x faster than alternatives\" not \"The best-in-class solution\"" },
          { title: "Locally Fluent", body: "Reference specific markets, cities, and currencies. Never say \"Asia-Pacific\" — say the specific market.", example: "✓ \"Jakarta enterprise buyers\" not \"APAC customers\"" },
        ].map((p) => (
          <div key={p.title} className="brand-card p-5">
            <div className="text-[13px] font-semibold text-foreground mb-1">{p.title}</div>
            <p className="text-[12px] text-text-secondary mb-2">{p.body}</p>
            <p className="text-[11px] text-muted font-mono-data">{p.example}</p>
          </div>
        ))}
      </div>

      {/* Vocabulary */}
      <Eyebrow className="mb-2">Vocabulary Guide</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Specific word choices that reinforce our brand positioning.</p>
      <div className="brand-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold text-foreground">Say This</th>
              <th className="text-left p-3 font-semibold text-foreground">Not This</th>
              <th className="text-left p-3 font-semibold text-foreground">Why</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Signal", "Lead / Contact", "Signals are richer than contacts — they carry intent"],
              ["Territory", "Region / Area", "Territories are mapped and owned — regions are vague"],
              ["Market grammar", "Market dynamics", "Grammar implies structure and rules — dynamics implies chaos"],
              ["Pipeline infrastructure", "Sales funnel", "Infrastructure is permanent — funnels are disposable"],
              ["Dense", "Comprehensive", "Dense implies precision — comprehensive implies exhaustive"],
              ["Southeast Asia", "APAC / Asia-Pacific", "Specificity over generalization — always"],
            ].map(([say, not, why]) => (
              <tr key={say} className="border-b border-border last:border-b-0">
                <td className="p-3 font-medium text-brand-emerald">{say}</td>
                <td className="p-3 text-destructive line-through">{not}</td>
                <td className="p-3 text-text-secondary">{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}
