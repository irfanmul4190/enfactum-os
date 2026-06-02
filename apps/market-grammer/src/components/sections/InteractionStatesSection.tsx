import { SectionWrapper, SectionHeader, Eyebrow, CopyToken } from "../SectionParts";

export function InteractionStatesSection() {
  return (
    <SectionWrapper id="interaction">
      <SectionHeader
        title={<>Interaction <span className="text-primary">States</span></>}
        subtitle="Every interactive element has 5 defined states. This section provides exact visual specs, CSS implementation patterns, and live demos for each state."
      />

      {/* State definitions */}
      <Eyebrow className="mb-2">State Definitions</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Every interactive element — buttons, cards, inputs, links, toggles — must implement all 5 states. No exceptions.</p>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold text-foreground">State</th>
              <th className="text-left p-3 font-semibold text-foreground">Visual Change</th>
              <th className="text-left p-3 font-semibold text-foreground">CSS</th>
              <th className="text-left p-3 font-semibold text-foreground">Duration</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Default", "Base styling, no elevation", "—", "—"],
              ["Hover", "translateY(-2px), subtle blue shadow", "transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,87,255,0.1);", "200ms"],
              ["Active/Pressed", "translateY(0), darker bg (Blue-600)", "transform: translateY(0); background: var(--blue-600);", "100ms"],
              ["Focused", "2px ring in Brand Blue, offset 2px", "outline: 2px solid var(--primary); outline-offset: 2px;", "Instant"],
              ["Disabled", "50% opacity, cursor not-allowed", "opacity: 0.5; cursor: not-allowed; pointer-events: none;", "—"],
            ].map(([state, visual, css, duration]) => (
              <tr key={state} className="border-b border-border last:border-b-0">
                <td className="p-3 font-medium text-foreground">{state}</td>
                <td className="p-3 text-text-secondary">{visual}</td>
                <td className="p-3"><CopyToken value={css as string} className="text-[10px] text-muted font-mono-data" /></td>
                <td className="p-3 font-mono-data text-muted">{duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive demo */}
      <Eyebrow className="mb-2">Interactive Demo</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Hover, click, and tab through these elements to see all 5 states in action.</p>
      <div className="brand-card p-6 mb-10">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="px-5 py-2.5 bg-brand-blue text-white text-[13px] font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:bg-brand-blue-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            Primary Button
          </button>
          <div
            className="brand-card p-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            <div className="text-[13px] font-semibold text-foreground">Hover Card</div>
            <div className="text-[11px] text-muted mt-1">Try hovering and clicking</div>
          </div>
          <button className="px-5 py-2.5 bg-brand-blue text-white text-[13px] font-semibold rounded-lg opacity-50 cursor-not-allowed">
            Disabled
          </button>
        </div>
        <div className="border-t border-border pt-4">
          <Eyebrow className="text-primary mb-2">How to Implement</Eyebrow>
          <CopyToken value="className='transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus:ring-2 focus:ring-primary focus:ring-offset-2'" className="text-[11px] text-muted font-mono-data break-all" />
        </div>
      </div>

      {/* Loading states */}
      <Eyebrow className="mb-2">Loading States</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Three loading patterns, each for a specific context. Never show a blank screen — always indicate progress.</p>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="brand-card p-5">
          <div className="text-[13px] font-semibold text-foreground mb-2">Skeleton Loading</div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-elevated rounded animate-pulse w-3/4" />
            <div className="h-4 bg-elevated rounded animate-pulse w-1/2" />
            <div className="h-4 bg-elevated rounded animate-pulse w-5/6" />
          </div>
          <Eyebrow className="text-primary mb-1">When to Use</Eyebrow>
          <p className="text-[11px] text-muted">Content-heavy areas: lists, data tables, dashboards. Matches the shape of the content being loaded.</p>
        </div>
        <div className="brand-card p-5">
          <div className="text-[13px] font-semibold text-foreground mb-2">Spinner</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 border-2 border-elevated border-t-primary rounded-full animate-spin" />
            <span className="text-[12px] text-muted">Loading...</span>
          </div>
          <Eyebrow className="text-primary mb-1">When to Use</Eyebrow>
          <p className="text-[11px] text-muted">Discrete actions: form submission, API call, button loading state. Always pair with text.</p>
        </div>
        <div className="brand-card p-5">
          <div className="text-[13px] font-semibold text-foreground mb-2">Progress Bar</div>
          <div className="h-1.5 bg-elevated rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-primary rounded-full w-2/3 transition-all duration-500" />
          </div>
          <Eyebrow className="text-primary mb-1">When to Use</Eyebrow>
          <p className="text-[11px] text-muted">Determinate operations: file uploads, data exports, multi-step wizards. Always show percentage.</p>
        </div>
      </div>

      {/* Error states */}
      <Eyebrow className="mb-2">Error & Empty States</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Errors must be specific and actionable. Empty states must guide the user to the next action.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="brand-card p-5">
          <Eyebrow className="text-destructive mb-2">Error State Pattern</Eyebrow>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-3">
            <p className="text-[13px] font-semibold text-destructive">Signal sync failed</p>
            <p className="text-[12px] text-text-secondary mt-1">Unable to connect to the Jakarta market feed. Check your API credentials in Settings → Integrations.</p>
          </div>
          <p className="text-[11px] text-muted">Always include: (1) what failed, (2) why it might have failed, (3) how to fix it.</p>
        </div>
        <div className="brand-card p-5">
          <Eyebrow className="text-muted mb-2">Empty State Pattern</Eyebrow>
          <div className="bg-elevated rounded-lg p-4 text-center mb-3">
            <p className="text-[13px] font-semibold text-foreground">No signals yet</p>
            <p className="text-[12px] text-text-secondary mt-1">Connect your first market to start capturing buying signals.</p>
            <button className="mt-3 px-4 py-2 bg-brand-blue text-white text-[12px] font-semibold rounded-lg">Connect Market</button>
          </div>
          <p className="text-[11px] text-muted">Always include: (1) what's missing, (2) why, (3) a clear CTA to fix it.</p>
        </div>
      </div>
    </SectionWrapper>
  );
}
