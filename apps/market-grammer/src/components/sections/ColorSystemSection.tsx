import { Check, X } from "lucide-react";
import { SectionWrapper, SectionHeader, CopyToken, Eyebrow } from "../SectionParts";

interface SwatchProps {
  name: string;
  hex: string;
  usage: string;
  cssVar?: string;
}

function ColorSwatch({ name, hex, usage, cssVar }: SwatchProps) {
  return (
    <div className="brand-card overflow-hidden">
      <div className="h-[100px]" style={{ backgroundColor: hex }} />
      <div className="p-3">
        <div className="text-[13px] font-semibold text-foreground">{name}</div>
        <CopyToken value={hex} className="text-[12px] text-muted mt-0.5" />
        {cssVar && <CopyToken value={cssVar} className="text-[11px] text-muted block mt-0.5" />}
        <div className="text-[11px] text-text-secondary mt-1">{usage}</div>
      </div>
    </div>
  );
}

export function ColorSystemSection() {
  return (
    <SectionWrapper id="color-system">
      <SectionHeader
        title={<>Color <span className="text-primary">System</span></>}
        subtitle="Our data-noir aesthetic requires absolute colour precision. This section covers every approved color, how to apply them, and what to avoid. Dark mode is ALWAYS the hero presentation."
      />

      {/* HOW TO USE */}
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6 mb-10">
        <p className="text-[14px] font-medium text-foreground mb-2">How to Apply Colors</p>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Never hardcode hex values directly in components. Always reference the semantic CSS custom properties (e.g., <CopyToken value="hsl(var(--primary))" className="text-[13px]" />) or Tailwind utility classes (e.g., <CopyToken value="text-primary" className="text-[13px]" />). This ensures consistent theming across light and dark modes.
        </p>
      </div>

      {/* Brand Blues */}
      <Eyebrow className="mb-2">Brand Blues</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">The blue spectrum is the heart of our visual identity. Brand Blue is the primary accent — use it for buttons, links, active states, and key UI highlights. Never use blue as a background fill.</p>
      <div className="grid grid-cols-5 gap-3 mb-10">
        <ColorSwatch name="Brand Blue" hex="#0057FF" cssVar="--primary" usage="Primary CTA, buttons, links, active indicators" />
        <ColorSwatch name="Electric Blue" hex="#2979FF" cssVar="--highlight" usage="Highlighted text in headlines, selected items" />
        <ColorSwatch name="Blue-600" hex="#0042CC" usage="Hover state for primary buttons" />
        <ColorSwatch name="Blue-700" hex="#002E99" usage="Active/pressed state, dark mode depth" />
        <ColorSwatch name="Blue-900" hex="#000D33" usage="Extreme dark accent, rarely used" />
      </div>

      {/* Neutrals */}
      <Eyebrow className="mb-2">Neutrals</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Neutrals create the spatial hierarchy. In dark mode, surfaces layer from deepest (Midnight) to brightest (White text). In light mode, the scale inverts. Always use the semantic token, not the raw hex.</p>
      <div className="grid grid-cols-7 gap-3 mb-10">
        <ColorSwatch name="Midnight" hex="#0A0F1E" cssVar="--background (dark)" usage="Primary dark background" />
        <ColorSwatch name="Neutral-800" hex="#0D1020" usage="Code blocks, inset areas" />
        <ColorSwatch name="Neutral-700" hex="#141829" cssVar="--section-alt" usage="Alt section bg, card surfaces" />
        <ColorSwatch name="Neutral-600" hex="#252A47" cssVar="--elevated" usage="Elevated surfaces, dropdowns" />
        <ColorSwatch name="Neutral-400" hex="#6B7290" cssVar="--muted" usage="Muted text, labels, placeholders" />
        <ColorSwatch name="Neutral-200" hex="#C8CDD9" cssVar="--text-secondary" usage="Secondary body text" />
        <ColorSwatch name="Neutral-000" hex="#FFFFFF" usage="Primary text on dark, backgrounds (light)" />
      </div>

      {/* Capability Accents */}
      <Eyebrow className="mb-2">Capability Accents</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Each of Enfactum's four capability pillars has a dedicated accent color. These are used exclusively for icon containers, badges, and inline indicators — <strong>never as background fills or large surface colors</strong>.</p>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <ColorSwatch name="Signal Blue" hex="#0057FF" usage="Signal Intelligence pillar — icon containers, badges" />
        <ColorSwatch name="Territory Violet" hex="#7C3AED" usage="Territory Architecture pillar — maps, regions" />
        <ColorSwatch name="Conversion Emerald" hex="#059669" usage="Conversion Infrastructure — success, growth" />
        <ColorSwatch name="Market Amber" hex="#D97706" usage="Market Intelligence — warnings, alerts" />
      </div>
      <div className="brand-card p-5 mb-10">
        <Eyebrow className="text-primary mb-3">How to Apply Accent Colors</Eyebrow>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[12px] font-semibold text-foreground mb-2">Icon Container (15% opacity bg)</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,87,255,0.15)" }}>
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#0057FF" }} />
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(124,58,237,0.15)" }}>
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#7C3AED" }} />
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(5,150,105,0.15)" }}>
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#059669" }} />
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(217,119,6,0.15)" }}>
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#D97706" }} />
              </div>
            </div>
            <p className="text-[11px] text-muted mt-2">Background at 15% opacity, icon at 100% solid.</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-foreground mb-2">Badge / Tag</p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ backgroundColor: "rgba(0,87,255,0.15)", color: "#0057FF" }}>Signal</span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "#7C3AED" }}>Territory</span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ backgroundColor: "rgba(5,150,105,0.15)", color: "#059669" }}>Conversion</span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ backgroundColor: "rgba(217,119,6,0.15)", color: "#D97706" }}>Market</span>
            </div>
            <p className="text-[11px] text-muted mt-2">Background at 15% opacity, text at 100%.</p>
          </div>
        </div>
      </div>

      {/* Application Rules */}
      <Eyebrow className="mb-4">Color Application Rules</Eyebrow>
      <div className="grid grid-cols-2 gap-4">
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-emerald mb-3 flex items-center gap-2"><Check size={14} /> Do</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Dark Mode is ALWAYS the hero. Design dark-first, adapt to light.</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Use CSS custom properties for all color values</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Capability accents at 15% opacity for containers, 100% for icons/text</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Use <CopyToken value="rgba(255,255,255,0.06)" className="text-[13px]" /> for card borders in dark mode</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Test all color combinations for WCAG AA contrast (4.5:1 minimum)</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-destructive mb-3 flex items-center gap-2"><X size={14} /> Don't</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never use gradients as primary background fills</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never mix dark and light mode surfaces on a single screen</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never use red (#FF0000) for negative data — use Neutral-400 muted gray</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never use accent colors for large areas (headers, section fills)</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Never hardcode hex values — always use tokens</li>
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
