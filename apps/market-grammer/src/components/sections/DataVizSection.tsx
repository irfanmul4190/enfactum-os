import { SectionWrapper, SectionHeader, Eyebrow, CopyToken } from "../SectionParts";

export function DataVizSection() {
  return (
    <SectionWrapper id="data-viz">
      <SectionHeader
        title={<>Data <span className="text-primary">Visualization</span></>}
        subtitle="Charts and data displays follow the same data-noir aesthetic. This section covers color mapping, chart types, typography rules, and animation patterns for all data visualizations."
      />

      {/* How to approach */}
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-6 mb-10">
        <p className="text-[14px] font-medium text-foreground mb-2">Visualization Philosophy</p>
        <p className="text-[13px] text-text-secondary leading-relaxed">
          Every chart must answer a specific question. If you can't state the question in one sentence, the chart shouldn't exist. Dark backgrounds (#0A0F1E) are always the hero context for data visualizations. Light mode charts are acceptable in documents and exports only.
        </p>
      </div>

      {/* Color mapping */}
      <Eyebrow className="mb-2">Chart Color Mapping</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Each color has a fixed semantic meaning. Never use colors interchangeably — a green value always means growth/positive.</p>
      <div className="brand-card overflow-hidden mb-10">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-semibold text-foreground">Color</th>
              <th className="text-left p-3 font-semibold text-foreground">Hex</th>
              <th className="text-left p-3 font-semibold text-foreground">Semantic Meaning</th>
              <th className="text-left p-3 font-semibold text-foreground">Use Cases</th>
            </tr>
          </thead>
          <tbody>
            {[
              { swatch: "#0057FF", hex: "#0057FF", meaning: "Primary data series", usage: "Main metric, current period, selected bar, primary line" },
              { swatch: "#2979FF", hex: "#2979FF", meaning: "Secondary data series", usage: "Comparison period, secondary metric, hover highlight" },
              { swatch: "#7C3AED", hex: "#7C3AED", meaning: "Tertiary / territory data", usage: "Third series in multi-line charts, territory breakdowns" },
              { swatch: "#059669", hex: "#059669", meaning: "Positive / growth", usage: "Up arrows, positive deltas, success indicators" },
              { swatch: "#D97706", hex: "#D97706", meaning: "Warning / caution", usage: "Thresholds approaching, attention needed" },
              { swatch: "#6B7290", hex: "#6B7290", meaning: "Baseline / muted", usage: "Inactive bars, grid lines, watermarks, benchmark lines" },
            ].map((c) => (
              <tr key={c.hex + c.meaning} className="border-b border-border last:border-b-0">
                <td className="p-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: c.swatch }} /></td>
                <td className="p-3"><CopyToken value={c.hex} className="text-[13px] text-muted" /></td>
                <td className="p-3 font-medium text-foreground">{c.meaning}</td>
                <td className="p-3 text-text-secondary">{c.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart examples */}
      <Eyebrow className="mb-2">Chart Examples</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Reference implementations showing correct styling, typography, and data density.</p>
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-brand-midnight rounded-xl p-6 h-[280px] flex flex-col">
          <Eyebrow className="text-brand-neutral-400 mb-1">Bar Chart — Signal Volume by Month</Eyebrow>
          <p className="text-[10px] text-brand-neutral-400 mb-3">Primary bar: Brand Blue. Inactive bars: Neutral-600. Axis labels: Mono 9px.</p>
          <div className="flex-1 flex items-end gap-2 pb-4">
            {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
              <div key={i} className="flex-1 rounded-t transition-all duration-200" style={{ height: `${h}%`, backgroundColor: i === 7 ? "#0057FF" : "#252A47", transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }} />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-mono-data text-brand-neutral-400">
            <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
          </div>
        </div>
        <div className="bg-brand-midnight rounded-xl p-6 h-[280px] flex flex-col">
          <Eyebrow className="text-brand-neutral-400 mb-1">KPI Card — Metric Display</Eyebrow>
          <p className="text-[10px] text-brand-neutral-400 mb-3">Value: Mono 48px SemiBold. Label: Sans 12px Regular. Delta: Mono 12px with arrow glyph.</p>
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="font-mono-data text-[48px] font-semibold text-white">2,847</div>
            <div className="text-[12px] text-brand-neutral-400 mt-1">Active Signals</div>
            <div className="text-[12px] text-brand-emerald mt-2 font-mono-data">↑ 12.4% vs last month</div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <Eyebrow className="mb-2">Visualization Implementation Rules</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">Follow these rules exactly. Every chart in the Enfactum ecosystem must be visually consistent.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="brand-card p-5">
          <h4 className="text-[13px] font-semibold text-foreground mb-3">Typography in Charts</h4>
          <ul className="space-y-2 text-[12px] text-text-secondary">
            <li>• All numeric values: <CopyToken value="IBM Plex Mono" className="text-[12px]" /></li>
            <li>• Axis labels: IBM Plex Sans 11px, Neutral-400</li>
            <li>• Chart titles: IBM Plex Sans 13px SemiBold</li>
            <li>• KPI hero values: Mono 48px SemiBold</li>
            <li>• Deltas: Mono 12px, green for positive, gray for negative</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <h4 className="text-[13px] font-semibold text-foreground mb-3">Styling & Animation</h4>
          <ul className="space-y-2 text-[12px] text-text-secondary">
            <li>• Dark backgrounds (<CopyToken value="#0A0F1E" className="text-[12px]" />) for hero context</li>
            <li>• Grid lines at <CopyToken value="8% opacity" className="text-[12px]" /> maximum</li>
            <li>• Never use red for negative values — use Neutral-400 gray</li>
            <li>• Animate data entry with <CopyToken value="40ms stagger" className="text-[12px]" /></li>
            <li>• KPI count-up: 300ms with Decelerate easing</li>
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
