import { Users, Copyright, Lock, CheckCircle, XCircle } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";
import { PromptCard } from "../PromptCard";

export function EthicalAISection() {
  return (
    <SectionWrapper id="ethical-ai">
      <Eyebrow className="mb-4">Governance · Ethical AI</Eyebrow>
      <SectionHeader
        title={<>
          <span className="text-primary">Ethical</span> AI Use
        </>}
        subtitle="Enfactum operates across 14 markets with distinct cultural contexts, representation needs, and data privacy norms. These are the non-negotiable rules for responsible AI use inside this brand."
      />

      {/* Three pillars */}
      <Eyebrow className="mb-4">Core Pillars</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="brand-card p-5">
          <div className="w-9 h-9 rounded-lg bg-brand-emerald/10 flex items-center justify-center mb-3">
            <Users size={18} className="text-brand-emerald" />
          </div>
          <h4 className="text-[14px] font-semibold text-foreground mb-2">Representation</h4>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            Operating in SEA means your default AI outputs — faces, settings, contexts — will skew Western unless explicitly overridden. Every image prompt must include market-specific representation instructions.
          </p>
        </div>
        <div className="brand-card p-5">
          <div className="w-9 h-9 rounded-lg bg-brand-violet/10 flex items-center justify-center mb-3">
            <Copyright size={18} className="text-brand-violet" />
          </div>
          <h4 className="text-[14px] font-semibold text-foreground mb-2">Copyright</h4>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            AI image tools trained on the internet can mimic named artists and reproduce near-identical work. Enfactum's prompts never reference specific artists by name. Style is described through attributes, not attribution.
          </p>
        </div>
        <div className="brand-card p-5">
          <div className="w-9 h-9 rounded-lg bg-brand-amber/10 flex items-center justify-center mb-3">
            <Lock size={18} className="text-brand-amber" />
          </div>
          <h4 className="text-[14px] font-semibold text-foreground mb-2">Data Privacy</h4>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            What you put into a public AI tool is potentially retained and used for training. Client names, deal values, unreleased product details, and personal contact information must never appear in a prompt sent to Claude.ai, ChatGPT, Midjourney, or any public AI interface.
          </p>
        </div>
      </div>

      {/* Representation rules */}
      <Eyebrow className="mb-4">Representation Rules</Eyebrow>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-elevated">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Context</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Required Guidance</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {[
              { ctx: "Any image with people", guide: '"Southeast Asian faces, urban professional context, [MARKET: SG/ID/VN/PH/TH/MY]"' },
              { ctx: "Office / workplace", guide: '"Modern Asian urban office aesthetic, no generic Western corporate stock"' },
              { ctx: "Event / conference", guide: '"Diverse SEA professional audience, business formal, no all-Western panels"' },
              { ctx: "Product / demo", guide: '"Context-appropriate device and hand skin tone for [TARGET MARKET]"' },
              { ctx: "Street / urban scene", guide: '"Actual [CITY] visual cues — not generic \'Asia\'"' },
            ].map((row) => (
              <tr key={row.ctx} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{row.ctx}</td>
                <td className="px-4 py-3 italic">{row.guide}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Copyright Do/Don't */}
      <Eyebrow className="mb-4">Copyright Rules</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="brand-card p-5">
          <Eyebrow className="text-brand-emerald mb-3">Do</Eyebrow>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> "Style: architectural photography, data-noir, brutalist minimalism"</li>
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> Describe lighting, materials, color temperature, composition</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <Eyebrow className="text-destructive mb-3">Don't</Eyebrow>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><XCircle size={14} className="text-destructive shrink-0 mt-0.5" /> "Style: like Andreas Gursky" or any named photographer/artist</li>
            <li className="flex items-start gap-2"><XCircle size={14} className="text-destructive shrink-0 mt-0.5" /> "In the style of [Brand]'s visual identity"</li>
            <li className="flex items-start gap-2"><XCircle size={14} className="text-destructive shrink-0 mt-0.5" /> Use AI to recreate a specific copyrighted image</li>
          </ul>
        </div>
      </div>

      {/* Data privacy */}
      <Eyebrow className="mb-4">Data Privacy — Never Put in a Public AI Tool</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="brand-card p-5">
          <Eyebrow className="text-destructive mb-3">Red List — Never Include</Eyebrow>
          <ul className="space-y-1.5 font-mono-data text-[12px] text-text-secondary">
            <li>× Client company names (use [CLIENT])</li>
            <li>× Deal values or contract amounts</li>
            <li>× Unreleased product or feature names</li>
            <li>× Employee personal data (names, salaries)</li>
            <li>× Internal financial metrics</li>
            <li>× Login credentials or API keys</li>
            <li>× Legal documents or NDAs</li>
            <li>× Personally identifiable information (PII)</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <Eyebrow className="text-brand-emerald mb-3">Green List — Safe to Include</Eyebrow>
          <ul className="space-y-1.5 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> Generic role descriptions ("VP Sales at a B2B SaaS company in Singapore")</li>
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> Public information already published</li>
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> Anonymized case study structures</li>
            <li className="flex items-start gap-2"><CheckCircle size={14} className="text-brand-emerald shrink-0 mt-0.5" /> Brand book content and design tokens</li>
          </ul>
        </div>
      </div>

      {/* Approved tools */}
      <Eyebrow className="mb-4">Approved Tools</Eyebrow>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-elevated">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Task</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Approved</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Use with Caution</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {[
              { task: "Long-form copy", approved: "Claude (Enterprise)", caution: "ChatGPT free tier" },
              { task: "Image generation", approved: "Midjourney, Flux", caution: "DALL-E 3 (OpenAI)" },
              { task: "Design generation", approved: "v0, Lovable", caution: "Canva AI" },
              { task: "Deck generation", approved: "Gamma", caution: "Beautiful.ai" },
              { task: "Data analysis", approved: "Claude (Enterprise)", caution: "Any free/public tool" },
              { task: "Client documents", approved: "Claude (Enterprise)", caution: "NEVER public tools" },
            ].map((row) => (
              <tr key={row.task} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{row.task}</td>
                <td className="px-4 py-3 text-brand-emerald">{row.approved}</td>
                <td className="px-4 py-3 text-brand-amber">{row.caution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Use with AI */}
      <Eyebrow className="mb-4 flex items-center gap-2">Use with AI</Eyebrow>
      <div className="space-y-4">
        <PromptCard
          id="prompt-sea-representation"
          tool="Claude"
          title="Add SEA Representation to Image Prompt"
          whenToUse="Before running any image generation prompt that includes people, workplaces, or urban settings."
          prompt={`Review this image generation prompt and add appropriate Southeast Asian representation guidelines:

[PASTE ORIGINAL IMAGE PROMPT]

Target market: [MARKET: SG / ID / VN / PH / TH / MY / general SEA]

Add to the prompt:
1. Specific representation instruction (faces, setting, cultural context)
2. City/environment visual cues specific to the target market
3. Any Western visual defaults to explicitly negate (--no Western office, --no generic stock corporate, etc.)

Return: the full revised prompt with your additions clearly marked [ADDED: ...]`}
        />
        <PromptCard
          id="prompt-sanitize-content"
          tool="Claude"
          title="Sanitize Content for Public AI Tools"
          whenToUse="Before pasting any client-related or sensitive content into a public AI interface."
          prompt={`Review the following content for sensitive information that must be removed or anonymized before use in a public AI tool (Claude.ai free, ChatGPT, Midjourney, etc.):

[PASTE CONTENT TO REVIEW]

Flag and replace:
× Real client names → [CLIENT]
× Deal values → [DEAL VALUE]
× Unreleased product names → [PRODUCT]
× Employee names → [TEAM MEMBER]
× Financial metrics → [METRIC]
× Any PII → [CONTACT INFO]

Return: sanitized version ready for use in a public AI tool, with a list of [N] replacements made.`}
        />
        <PromptCard
          id="prompt-copyright-safe-style"
          tool="Claude"
          title="Copyright-Safe Style Description"
          whenToUse="When you want to reference a visual style you've seen without naming the source."
          prompt={`I want to generate imagery in the visual style of [DESCRIBE WHAT YOU SAW — don't name the artist or brand].

Convert this into a copyright-safe style description using only:
- Compositional attributes (symmetry, negative space, rule of thirds)
- Lighting descriptors (direction, temperature, quality, hardness)
- Material and texture language (matte, grain, specular, glossy)
- Color temperature and palette (no hex values from reference images)
- Photographic or render technique terms

Do not reference any named artist, photographer, brand, or specific work.

Return: a copyright-safe style block ready to append to a Midjourney or Gemini prompt.`}
        />
      </div>
    </SectionWrapper>
  );
}
