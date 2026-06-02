import { Download, Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow, CopyToken } from "../SectionParts";
import { EnfactumLogo, FactMark } from "@repo/ui/enfactum-logo";

export function LogoGuidelinesSection() {
  return (
    <SectionWrapper id="logo-guidelines">
      <SectionHeader
        title={<>Logo <span className="text-primary">Guidelines</span></>}
        subtitle="The wordmark is the cornerstone of Enfactum's visual identity. This section covers every variant, approved usage, sizing rules, and placement guidance."
        action={
          <button className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-xl text-[13px] font-medium text-muted cursor-not-allowed opacity-60 transition-all duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <Download size={14} /> Download Logo Kit
          </button>
        }
      />

      {/* THE WORDMARK SYSTEM */}
      <Eyebrow className="mb-2">The Wordmark System</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-6">
        The Enfactum wordmark uses a distinctive tri-color split: <strong>"en"</strong> in the current text color, <strong>"fact"</strong> always in Brand Blue (<CopyToken value="#0057FF" className="text-[13px]" />), and <strong>"um"</strong> in the current text color. This split is mandatory in all contexts — never render the full name in a single color.
      </p>

      {/* Primary display */}
      <div className="mb-4 bg-brand-midnight rounded-xl flex items-center justify-center min-h-[200px]">
        <EnfactumLogo size={64} variant="dark" />
      </div>
      <p className="text-[12px] text-muted mb-10">Primary wordmark on dark background — the default and preferred usage.</p>

      {/* Three variants */}
      <Eyebrow className="mb-4">Logo Variants</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">
        Three approved variants exist. Choose based on background context and available space. The primary dark variant should be used whenever possible.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="bg-brand-midnight rounded-xl flex items-center justify-center h-[140px]">
          <EnfactumLogo size={36} variant="dark" />
        </div>
        <div className="bg-white border border-border-subtle rounded-xl flex items-center justify-center h-[140px]">
          <EnfactumLogo size={36} variant="light" />
        </div>
        <div className="bg-white rounded-xl flex items-center justify-center h-[140px]">
          <FactMark size={48} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="brand-card p-4">
          <Eyebrow className="mb-1">Primary (Dark)</Eyebrow>
          <p className="text-[12px] text-text-secondary">Website hero, pitch decks, social media banners, app loading screen. Default choice for all external-facing materials.</p>
        </div>
        <div className="brand-card p-4">
          <Eyebrow className="mb-1">Light Variant</Eyebrow>
          <p className="text-[12px] text-text-secondary">Internal documents, white-background emails, printed materials, light mode UI. "en" and "um" render in Midnight (#0A0F1E).</p>
        </div>
        <div className="brand-card p-4">
          <Eyebrow className="mb-1">Symbol Mark</Eyebrow>
          <p className="text-[12px] text-text-secondary">Favicon (16×16, 32×32), app icons, social profile avatars, and any context below 120px width. Consists of the "fact" letters only.</p>
        </div>
      </div>

      {/* Clear space */}
      <div className="mb-10">
        <Eyebrow className="mb-2">Clear Space & Minimum Size</Eyebrow>
        <p className="text-[13px] text-text-secondary mb-4">
          The clear space zone equals the cap height of the lowercase "e" in the wordmark, measured on all four sides. No text, icons, borders, or graphic elements may enter this zone.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="brand-card p-8 flex items-center justify-center">
            <div className="border-2 border-dashed border-muted p-8 relative">
              <EnfactumLogo size={32} />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono-data text-muted">x</span>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono-data text-muted">x</span>
              <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-[10px] font-mono-data text-muted">x</span>
              <span className="absolute top-1/2 -right-3 -translate-y-1/2 text-[10px] font-mono-data text-muted">x</span>
            </div>
          </div>
          <div className="brand-card p-6">
            <h4 className="text-[14px] font-semibold text-foreground mb-3">Minimum Size Rules</h4>
            <ul className="space-y-2">
              {[
                { label: "Digital (wordmark)", value: "120px wide minimum" },
                { label: "Digital (symbol)", value: "16px × 16px minimum" },
                { label: "Print (wordmark)", value: "30mm wide minimum" },
                { label: "Print (symbol)", value: "8mm × 8mm minimum" },
              ].map((r) => (
                <li key={r.label} className="flex items-center justify-between text-[13px]">
                  <span className="text-text-secondary">{r.label}</span>
                  <span className="font-mono-data text-muted">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Approved Backgrounds */}
      <Eyebrow className="mb-2">Approved Background Contexts</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">The logo may only appear on these background types. If your background doesn't match, choose a different placement.</p>
      <div className="grid grid-cols-4 gap-3 mb-10">
        {[
          { bg: "#0A0F1E", label: "Midnight", text: "text-white", approved: true },
          { bg: "#141829", label: "Neutral-700", text: "text-white", approved: true },
          { bg: "#FFFFFF", label: "White", text: "text-[#0A0F1E]", approved: true },
          { bg: "#EEF1F8", label: "Light Gray", text: "text-[#0A0F1E]", approved: true },
        ].map((item) => (
          <div key={item.label} className="rounded-xl h-20 flex flex-col items-center justify-center" style={{ backgroundColor: item.bg }}>
            <span className={`font-bold text-[18px] tracking-tight ${item.text}`}>
              en<span className="text-brand-blue">fact</span>um
            </span>
            <span className={`text-[10px] mt-1 opacity-60 ${item.text}`}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Usage rules */}
      <Eyebrow className="mb-4">Usage Rules — Do & Don't</Eyebrow>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-emerald mb-3 flex items-center gap-2">
            <Check size={14} /> Do
          </h4>
          <ul className="space-y-2">
            {[
              "Always use the tri-color split: en (text) + fact (Blue) + um (text)",
              "Use the logo in its original proportions — never distort",
              "Maintain minimum clearspace equal to the cap height of 'e'",
              "Use on approved backgrounds only (dark, white, light gray)",
              "Use the symbol mark when width is below 120px",
              "Always set in IBM Plex Sans Bold — no other typeface",
            ].map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] text-text-secondary">
                <Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-destructive mb-3 flex items-center gap-2">
            <X size={14} /> Don't
          </h4>
          <ul className="space-y-2">
            {[
              "Render the entire name in a single color (all blue, all black)",
              "Stretch, skew, or rotate the logo",
              "Apply drop shadows, outlines, or glow effects",
              "Change the blue to any other color",
              "Use on busy photographic backgrounds or gradients",
              "Set in italic, condensed, or any non-Bold weight",
              "Place over video without a semi-transparent overlay",
            ].map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] text-text-secondary">
                <X size={14} className="text-destructive mt-0.5 shrink-0" /> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
