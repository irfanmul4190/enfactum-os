import { SectionWrapper, SectionHeader, Eyebrow, CopyToken } from "../SectionParts";

export function UIComponentsSection() {
  return (
    <SectionWrapper id="ui-components">
      <SectionHeader
        title={<>UI <span className="text-primary">Components</span></>}
        subtitle="Dense, information-rich components built for data-heavy B2B interfaces. This section provides specs, usage guidance, and implementation examples for every core component."
      />

      {/* Button styles */}
      <Eyebrow className="mb-2">Button Hierarchy</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Buttons follow a strict 4-tier hierarchy. Only one Primary button per visible section. Use the lowest-emphasis button that fits the context.</p>
      <div className="brand-card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <button className="px-5 py-2.5 bg-brand-blue text-white text-[13px] font-semibold rounded-lg hover:bg-brand-blue-600 transition-all duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}>
            Primary Action
          </button>
          <button className="px-5 py-2.5 border border-border text-foreground text-[13px] font-medium rounded-lg hover:bg-elevated transition-all duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}>
            Secondary
          </button>
          <button className="px-5 py-2.5 text-primary text-[13px] font-medium hover:bg-elevated rounded-lg transition-all duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}>
            Ghost
          </button>
          <button className="px-5 py-2.5 text-destructive text-[13px] font-medium hover:bg-destructive/10 rounded-lg transition-all duration-200" style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}>
            Destructive
          </button>
        </div>
      </div>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold text-foreground">Variant</th>
              <th className="text-left p-3 font-semibold text-foreground">When to Use</th>
              <th className="text-left p-3 font-semibold text-foreground">Specs</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Primary", "Main CTA: submit, save, confirm. Max 1 per visible section.", "bg: Brand Blue, text: white, hover: Blue-600, radius: 8px"],
              ["Secondary", "Alternative actions: cancel, edit, view details. Pairs with Primary.", "bg: transparent, border: 1px border-default, hover: bg-elevated"],
              ["Ghost", "Tertiary actions: learn more, skip, back. Minimal visual weight.", "bg: transparent, text: primary, hover: bg-elevated"],
              ["Destructive", "Dangerous actions: delete, remove, disconnect. Always requires confirmation.", "bg: transparent, text: destructive, hover: bg-destructive/10"],
            ].map(([variant, when, specs]) => (
              <tr key={variant} className="border-b border-border last:border-b-0">
                <td className="p-3 font-medium text-foreground">{variant}</td>
                <td className="p-3 text-text-secondary">{when}</td>
                <td className="p-3"><CopyToken value={specs as string} className="text-[11px] text-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Input fields */}
      <Eyebrow className="mb-2">Input Fields</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">All input fields share the same base specs. Labels always above the field. Error messages appear below in destructive red with an icon.</p>
      <div className="brand-card p-6 mb-10">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-[12px] font-medium text-foreground mb-1.5 block">Default</label>
            <div className="h-10 border border-border rounded-lg px-3 flex items-center text-[13px] text-muted transition-colors duration-200">
              Placeholder text...
            </div>
            <p className="text-[11px] text-muted mt-1.5">Helper text goes here</p>
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground mb-1.5 block">Focused</label>
            <div className="h-10 border-2 border-primary rounded-lg px-3 flex items-center text-[13px] text-foreground">
              Active input
            </div>
            <p className="text-[11px] text-muted mt-1.5">Label remains visible during focus</p>
          </div>
          <div>
            <label className="text-[12px] font-medium text-destructive mb-1.5 block">Error State</label>
            <div className="h-10 border-2 border-destructive rounded-lg px-3 flex items-center text-[13px] text-foreground">
              Invalid value
            </div>
            <p className="text-[11px] text-destructive mt-1.5">This field is required</p>
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <Eyebrow className="text-primary mb-2">Specs</Eyebrow>
          <p className="text-[12px] text-muted">
            Height: <CopyToken value="40px" className="text-[12px]" /> · Border: <CopyToken value="1px solid border-default" className="text-[12px]" /> · Focus: <CopyToken value="2px solid Brand Blue" className="text-[12px]" /> · Radius: <CopyToken value="8px" className="text-[12px]" /> · Label: 12px Medium above · Helper: 11px Regular below · Padding: 12px horizontal
          </p>
        </div>
      </div>

      {/* Cards */}
      <Eyebrow className="mb-2">Card Variants</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Three card styles serve different purposes. Choose based on the content hierarchy, not visual preference.</p>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="brand-card p-5">
          <Eyebrow className="mb-2">Default Card</Eyebrow>
          <p className="text-[13px] text-text-secondary mb-3">Standard content grouping. Subtle 1px border, 12px radius. Hover: translateY(-2px) + blue shadow.</p>
          <Eyebrow className="text-primary mb-1">Use For</Eyebrow>
          <p className="text-[11px] text-muted">Feature cards, info panels, data groupings, settings sections</p>
        </div>
        <div className="bg-elevated rounded-xl p-5 transition-colors duration-200">
          <Eyebrow className="mb-2">Elevated Card</Eyebrow>
          <p className="text-[13px] text-text-secondary mb-3">Higher-emphasis surface for highlighted or nested content. No border, elevated bg color.</p>
          <Eyebrow className="text-primary mb-1">Use For</Eyebrow>
          <p className="text-[11px] text-muted">Active states, selected items, code blocks, nested sections</p>
        </div>
        <div className="border-l-2 border-primary bg-surface rounded-r-xl p-5">
          <Eyebrow className="mb-2">Accent Card</Eyebrow>
          <p className="text-[13px] text-text-secondary mb-3">Left border accent for high-priority callouts. Draws attention without being disruptive.</p>
          <Eyebrow className="text-primary mb-1">Use For</Eyebrow>
          <p className="text-[11px] text-muted">Pull quotes, important tips, key insights, brand guidelines callouts</p>
        </div>
      </div>

      {/* Badges */}
      <Eyebrow className="mb-2">Badges & Tags</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Badges use capability accent colors at 15% bg opacity with solid text. Always use the semantic pillar color — never mix.</p>
      <div className="brand-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-blue/15 text-brand-blue">Signal</span>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-violet/15 text-brand-violet">Territory</span>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-emerald/15 text-brand-emerald">Conversion</span>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-amber/15 text-brand-amber">Market</span>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-elevated text-muted">Neutral</span>
        </div>
        <Eyebrow className="text-primary mb-1">Specs</Eyebrow>
        <p className="text-[12px] text-muted">
          Font: <CopyToken value="11px SemiBold" className="text-[12px]" /> · Padding: <CopyToken value="10px 8px" className="text-[12px]" /> · Radius: <CopyToken value="6px" className="text-[12px]" /> · Background: pillar color at 15% opacity · Text: pillar color at 100%
        </p>
      </div>
    </SectionWrapper>
  );
}
