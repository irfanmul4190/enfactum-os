import { SectionWrapper, SectionHeader, CopyToken, Eyebrow } from "../SectionParts";

export function MotionSection() {
  return (
    <SectionWrapper id="motion">
      <SectionHeader
        title={<><span className="text-primary">Motion</span> &amp; Animation</>}
        subtitle="Precise deceleration only. No spring physics, no bounce. This section provides every easing curve, timing token, and implementation pattern your team needs."
      />

      {/* Philosophy */}
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6 mb-10">
        <p className="text-[14px] font-medium text-foreground mb-2">Motion Philosophy</p>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Everything moves with the confidence of a system that knows exactly where it's going. Motion communicates hierarchy (what enters first matters most), state (hover → lift, press → settle), and data density (metrics count up, charts stagger in). The easing function <CopyToken value="cubic-bezier(0.4, 0, 0.2, 1)" className="text-[13px]" /> is our standard — use it everywhere unless the specific context below dictates otherwise.
        </p>
      </div>

      {/* Easing curves */}
      <Eyebrow className="mb-2">Easing Curves</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Three curves cover every animation scenario. Click to copy the CSS value.</p>
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { name: "Enter — Decelerate", curve: "cubic-bezier(0.0, 0.0, 0.2, 1.0)", desc: "Fast start, smooth landing. Use for elements entering the viewport: modals opening, cards appearing, tooltips fading in.", when: "Modal open, toast enter, dropdown expand, page content load", anim: "animate-dot-decel" },
          { name: "Exit — Accelerate", curve: "cubic-bezier(0.4, 0.0, 1.0, 1.0)", desc: "Slow start, sharp departure. Use for elements leaving the viewport: modals closing, notifications dismissing.", when: "Modal close, toast dismiss, dropdown collapse, page exit", anim: "animate-dot-accel" },
          { name: "Standard", curve: "cubic-bezier(0.4, 0.0, 0.2, 1.0)", desc: "Balanced motion for state changes that stay on screen: hover effects, color transitions, layout shifts.", when: "Hover state, color change, layout shift, tab switch, toggle", anim: "animate-dot-standard" },
        ].map((c) => (
          <div key={c.name} className="brand-card p-5">
            <div className="text-[13px] font-semibold text-foreground mb-1">{c.name}</div>
            <CopyToken value={c.curve} className="text-[11px] text-muted mb-3" />
            <div className="relative h-3 bg-elevated rounded-full mb-3">
              <div className={`absolute top-0.5 w-3 h-2 rounded-full bg-primary ${c.anim}`} />
            </div>
            <p className="text-[12px] text-text-secondary mb-3">{c.desc}</p>
            <div className="border-t border-border pt-2 mt-2">
              <Eyebrow className="text-primary mb-1">When to Use</Eyebrow>
              <p className="text-[11px] text-text-secondary">{c.when}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Duration scale */}
      <Eyebrow className="mb-2">Duration Scale</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Every duration maps to a semantic token. Use the token name in your code, not the raw ms value. Click to copy.</p>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold text-foreground">Token</th>
              <th className="text-left p-3 font-semibold text-foreground">Duration</th>
              <th className="text-left p-3 font-semibold text-foreground">Usage</th>
              <th className="text-left p-3 font-semibold text-foreground">Example</th>
              <th className="text-left p-3 font-semibold text-foreground">Visual</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Instant", "0ms", "Toggles, boolean flags", "Checkbox tick, radio select", 0],
              ["Fast", "100ms", "Microinteractions", "Icon color on hover, tooltip arrow", 12],
              ["Base", "200ms", "Standard interactions", "Button hover bg, card border glow, nav link color", 25],
              ["Medium", "300ms", "Panel transitions", "Card lift on hover, sidebar expand, dropdown open", 37],
              ["Slow", "500ms", "Page-level changes", "Modal enter, page transition, theme switch", 62],
              ["Cinematic", "800ms", "Hero reveals", "Landing page hero, data dashboard first load, KPI count-up", 100],
            ].map(([token, dur, usage, example, width]) => (
              <tr key={token as string} className="border-b border-border last:border-b-0">
                <td className="p-3 font-medium text-foreground">{token}</td>
                <td className="p-3"><CopyToken value={dur as string} className="text-[13px] text-muted" /></td>
                <td className="p-3 text-text-secondary">{usage}</td>
                <td className="p-3 text-muted text-[12px]">{example}</td>
                <td className="p-3">
                  <div className="h-2 bg-primary rounded-full" style={{ width: `${width}%`, minWidth: width ? 4 : 0 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSS Implementation */}
      <Eyebrow className="mb-2">Implementation Guide</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Copy these CSS patterns directly into your components. Every interactive element in the app must use one of these.</p>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {[
          { label: "Button hover", css: "transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);" },
          { label: "Card hover (lift)", css: "transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);\n&:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,87,255,0.1); }" },
          { label: "Nav link", css: "transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);" },
          { label: "Theme toggle", css: "transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);" },
        ].map((snippet) => (
          <div key={snippet.label} className="brand-card p-4">
            <Eyebrow className="mb-2">{snippet.label}</Eyebrow>
            <CopyToken value={snippet.css} className="text-[11px] text-muted font-mono-data whitespace-pre-wrap leading-relaxed" />
          </div>
        ))}
      </div>

      {/* Motion principles */}
      <Eyebrow className="mb-4">Motion Principles</Eyebrow>
      <div className="grid grid-cols-2 gap-4">
        {[
          { title: "Data Enters Sequentially", body: "Metrics stagger in at 40ms intervals. Never simultaneous. The most important metric loads first.", howTo: "Use stagger delays: item 1 at 0ms, item 2 at 40ms, item 3 at 80ms. Each with 300ms Decelerate curve." },
          { title: "Numbers Count Up", body: "Metric values animate from zero on first render. 300ms ease-out. Triggers on scroll-into-view, not page load.", howTo: "Use requestAnimationFrame to interpolate from 0 → final value over 300ms with Decelerate easing." },
          { title: "Glow is Alive", body: "Hover glows pulse at 2s interval. Never static. The glow indicates 'this is interactive.'", howTo: "CSS: @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 0 rgba(0,87,255,0) } 50% { box-shadow: 0 0 20px rgba(0,87,255,0.15) } }" },
          { title: "Cards Lift, Never Bounce", body: "Hover: translateY(-2px) + elevated shadow. Press: translateY(0). No bounce, no overshoot, no spring physics.", howTo: "Tailwind: hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 with transition-all duration-200." },
        ].map((p) => (
          <div key={p.title} className="brand-card p-5">
            <div className="text-[13px] font-semibold text-foreground mb-1">{p.title}</div>
            <p className="text-[12px] text-text-secondary mb-3">{p.body}</p>
            <div className="border-t border-border pt-2">
              <Eyebrow className="text-primary mb-1">How to Implement</Eyebrow>
              <p className="text-[11px] text-muted font-mono-data leading-relaxed">{p.howTo}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
