import { Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, CopyToken, Eyebrow } from "../SectionParts";
import { useTheme } from "../ThemeProvider";

export function TypographySection() {
  const { theme } = useTheme();
  const highlightColor = theme === "dark" ? "#2979FF" : "#0057FF";

  return (
    <SectionWrapper id="typography">
      <SectionHeader
        title={<><span className="text-primary">Typography</span> System</>}
        subtitle="Clear, dense, and precise. This section defines every approved typeface, weight, size, and typographic technique — including how to handle multi-script SEA content."
      />

      {/* Typeface cards */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="brand-card p-6">
          <Eyebrow className="mb-4">Primary Typeface — IBM Plex Sans</Eyebrow>
          <div className="text-[48px] font-bold text-foreground leading-none mb-4">Aa Bb Cc</div>
          <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
            Used for all headings, body copy, UI labels, and navigation. Available weights: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700).
          </p>
          <div className="border-t border-border pt-3 mt-3">
            <Eyebrow className="text-primary mb-2">How to Use</Eyebrow>
            <ul className="space-y-1 text-[12px] text-text-secondary">
              <li>• Headings: Bold (700) or SemiBold (600)</li>
              <li>• Body copy: Regular (400) at 16px</li>
              <li>• UI labels & eyebrows: SemiBold (600) at 10-12px</li>
              <li>• Never use Light (300) for body — only for large display text (&gt;40px)</li>
            </ul>
          </div>
        </div>
        <div className="brand-card p-6">
          <Eyebrow className="mb-4">Data Typeface — IBM Plex Mono</Eyebrow>
          <div className="text-[40px] font-mono-data text-foreground leading-none mb-4">01 23 45</div>
          <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
            Used strictly for numeric data, metrics, KPI values, code blocks, and design token references. Available weights: Regular (400), SemiBold (600).
          </p>
          <div className="border-t border-border pt-3 mt-3">
            <Eyebrow className="text-primary mb-2">How to Use</Eyebrow>
            <ul className="space-y-1 text-[12px] text-text-secondary">
              <li>• Metric values: SemiBold (600) at 32-48px</li>
              <li>• Data labels: Regular (400) at 11-14px</li>
              <li>• Code snippets: Regular (400) at 13px</li>
              <li>• Never use for body copy, headings, or navigation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Type scale */}
      <Eyebrow className="mb-2">Type Scale — Complete Reference</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Click any value to copy. Each scale token maps to a specific use case — never mix tokens across categories.</p>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold text-foreground">Token</th>
              <th className="text-left p-3 font-semibold text-foreground">Size / Weight</th>
              <th className="text-left p-3 font-semibold text-foreground">Line Height</th>
              <th className="text-left p-3 font-semibold text-foreground">Use Case</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Display-01", "72px / Bold", "1.1", "Hero headlines, landing page titles"],
              ["Display-02", "56px / Bold", "1.15", "Section heroes, campaign headers"],
              ["Heading-01", "40px / Bold", "1.2", "Page titles, primary section headings"],
              ["Heading-02", "32px / SemiBold", "1.25", "Sub-section headings, card titles"],
              ["Heading-03", "24px / SemiBold", "1.3", "Sidebar headings, widget titles"],
              ["Body-Large", "18px / Regular", "1.6", "Lead paragraphs, intro text"],
              ["Body", "16px / Regular", "1.6", "Default body copy, descriptions"],
              ["Body-Small", "14px / Regular", "1.5", "Secondary text, metadata, captions"],
              ["Caption", "12px / Medium", "1.4", "Labels, timestamps, helper text"],
              ["Eyebrow", "10px / SemiBold", "1.0", "Section labels, category tags (+ 0.12em tracking, uppercase)"],
              ["Mono-Data", "14px / Mono Regular", "1.5", "Numeric values, code, tokens"],
              ["Mono-Display", "48px / Mono SemiBold", "1.0", "KPI hero numbers, dashboard metrics"],
            ].map(([token, spec, lineHeight, useCase]) => (
              <tr key={token} className="border-b border-border last:border-b-0">
                <td className="p-3 font-medium text-foreground">{token}</td>
                <td className="p-3"><CopyToken value={spec as string} className="text-[13px] text-muted" /></td>
                <td className="p-3 font-mono-data text-muted">{lineHeight}</td>
                <td className="p-3 text-text-secondary">{useCase}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selective Word Highlighting */}
      <Eyebrow className="mb-2">Selective Word Highlighting</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">
        Our signature typographic technique: in bold headlines, 1–2 strategically chosen words are set in Electric Blue to create focal emphasis. This draws the eye to the key message without over-decorating.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="brand-card p-5">
          <Eyebrow className="text-brand-emerald mb-3">✓ Correct Examples</Eyebrow>
          <div className="space-y-4">
            <p className="text-[24px] font-bold text-foreground leading-tight">
              Where markets meet <span style={{ color: highlightColor }}>intelligence</span>.
            </p>
            <p className="text-[24px] font-bold text-foreground leading-tight">
              Built for <span style={{ color: highlightColor }}>SEA</span> complexity.
            </p>
            <p className="text-[24px] font-bold text-foreground leading-tight">
              <span style={{ color: highlightColor }}>14 markets</span>. One system.
            </p>
          </div>
          <p className="text-[11px] text-muted mt-3">Max 2 highlighted words per line. Always the most semantically important words.</p>
        </div>
        <div className="brand-card p-5">
          <Eyebrow className="text-destructive mb-3">✗ Incorrect Examples</Eyebrow>
          <div className="space-y-4">
            <div>
              <p className="text-[24px] font-bold text-foreground leading-tight">
                <span className="italic" style={{ color: highlightColor }}>Where</span> markets meet <span className="italic" style={{ color: highlightColor }}>intelligence</span>.
              </p>
              <p className="text-[11px] text-destructive mt-1">Never italicize highlighted words</p>
            </div>
            <div>
              <p className="text-[24px] font-bold leading-tight" style={{ color: highlightColor }}>
                Where markets meet intelligence.
              </p>
              <p className="text-[11px] text-destructive mt-1">Never highlight the entire line</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-foreground leading-tight underline decoration-2" style={{ textDecorationColor: highlightColor }}>
                Where markets meet intelligence.
              </p>
              <p className="text-[11px] text-destructive mt-1">Never underline — only color change</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-script */}
      <Eyebrow className="mb-2">Multi-Script Typography</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">
        Enfactum serves markets with Thai, Vietnamese, Bahasa, Tagalog, and Mandarin scripts. Never romanize — always render in native script at the equivalent IBM Plex weight.
      </p>
      <div className="brand-card p-6 mb-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { lang: "Thai", sample: "ตลาดเอเชียตะวันออกเฉียงใต้", note: "Requires full Thai Unicode support" },
            { lang: "Vietnamese", sample: "Thị trường Đông Nam Á", note: "Full diacritical marks — all tonal marks" },
            { lang: "Bahasa", sample: "Pasar Asia Tenggara", note: "Latin script, but distinct from English" },
          ].map((item) => (
            <div key={item.lang}>
              <Eyebrow className="mb-2">{item.lang}</Eyebrow>
              <p className="text-[18px] font-semibold text-foreground mb-1">{item.sample}</p>
              <p className="text-[11px] text-muted">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* IBM Plex Serif */}
      <div className="bg-brand-midnight rounded-xl p-10 text-center">
        <Eyebrow className="text-brand-neutral-400 mb-4">Accent Typeface — IBM Plex Serif (Quotes Only)</Eyebrow>
        <p className="font-serif-accent text-[24px] text-white leading-relaxed italic">
          "The grammar of Southeast Asian markets is not written in Western startup aesthetic."
        </p>
        <p className="mt-4 text-[12px] text-brand-neutral-400">
          Use IBM Plex Serif exclusively for pull quotes, testimonials, and editorial highlights. Never for body copy, headings, or UI elements.
        </p>
      </div>
    </SectionWrapper>
  );
}
