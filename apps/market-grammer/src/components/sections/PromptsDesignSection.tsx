import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";
import { PromptCard } from "../PromptCard";

export function PromptsDesignSection() {
  return (
    <SectionWrapper id="prompts-design">
      <SectionHeader
        title={<>Design <span className="text-primary">Generation</span> Prompts</>}
        subtitle="Prompts for generating on-brand UI components, layouts, and design system extensions using AI code generation tools."
      />

      <Eyebrow className="mb-4">Component Generation</Eyebrow>
      <div className="space-y-4 mb-10">
        <PromptCard
          id="prompt-kpi-card"
          tool={["v0", "Lovable"]}
          title="Build a KPI Metric Card"
          whenToUse="Dashboard widgets, report summaries, executive views."
          prompt={`Build a React metric card component for Enfactum's Market Grammar design system.

Design specs:
- Background: var(--bg2) with 1px border var(--bdr2), radius 12px
- Metric value: IBM Plex Mono, 48px, SemiBold, var(--tx)
- Label: IBM Plex Sans, 12px, Regular, var(--muted)
- Delta indicator: IBM Plex Mono, 12px, green (#059669) for positive, gray (#6B7290) for negative, with ↑/↓ glyph
- Hover: translateY(-2px) + box-shadow 0 4px 16px rgba(0,87,255,0.1)
- Transition: 200ms cubic-bezier(0.4, 0, 0.2, 1)
- The metric value should count up from 0 on mount using requestAnimationFrame, 300ms duration

Props: value: number, label: string, delta: number, deltaLabel: string

Use Tailwind CSS. No external component libraries.`}
        />
        <PromptCard
          id="prompt-data-table"
          tool={["v0", "Lovable"]}
          title="Build a Dense Data Table"
          whenToUse="Signal feeds, territory lists, pipeline views."
          prompt={`Build a React data table component for Enfactum's Market Grammar design system.

Design specs:
- Table container: var(--bg2), border 1px var(--bdr2), radius 12px, overflow hidden
- Header row: var(--surface) background, text: 11px SemiBold uppercase tracking-wider var(--muted)
- Body rows: 13px Regular var(--tx2), border-bottom 1px var(--bdr)
- Hover row: background var(--glow)
- Selected row: 2px left border var(--accent), background var(--glow)
- Numeric columns: IBM Plex Mono
- Sortable headers: click to sort with chevron indicator
- Maximum information density — minimal padding (12px horizontal, 8px vertical)

Props: columns: Column[], data: Row[], onRowClick?: (row) => void

Use Tailwind CSS. Support both light and dark mode.`}
        />
        <PromptCard
          id="prompt-dashboard"
          tool="Lovable"
          title="Build a Full Dashboard Layout"
          whenToUse="Starting a new dashboard page or admin view."
          prompt={`Build a React dashboard layout page for Enfactum's Market Grammar design system.

Layout structure:
- Fixed left sidebar (240px) with navigation
- Top header bar with breadcrumbs and user avatar
- Main content area with CSS Grid: 
  - Top row: 4 KPI metric cards in a row
  - Middle row: 2/3 width chart + 1/3 width signal feed
  - Bottom row: full-width data table

Design tokens:
- Background: var(--bg), cards: var(--bg2)
- All borders: 1px var(--bdr2), radius 12px
- Typography: IBM Plex Sans for labels, IBM Plex Mono for data
- Motion: all transitions 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Cards hover: translateY(-2px) + blue glow shadow

Use Tailwind CSS. Responsive — stack to single column on mobile.`}
        />
      </div>

      <Eyebrow className="mb-4">Token & Config Generation</Eyebrow>
      <div className="space-y-4">
        <PromptCard
          id="prompt-color-token"
          tool="Claude"
          title="Generate Color Token Config"
          whenToUse="Starting a new project or microsite."
          prompt={`Generate a complete CSS custom properties color token system for a React/Tailwind project following Enfactum's Market Grammar design system.

Requirements:
- Primary font: IBM Plex Sans
- Mono font: IBM Plex Mono (data only)
- Support light and dark mode via [data-theme='light|dark'] on <html>
- Use these exact token names and values:

Dark mode: bg-primary #0A0F1E, bg-secondary #141829, bg-surface #252A47, text-primary #FFFFFF, text-secondary #C8CDD9, text-muted #6B7290, accent-primary #0057FF, text-accent #2979FF, border-subtle rgba(255,255,255,0.06), border-default rgba(255,255,255,0.12)

Light mode: bg-primary #F8F9FC, bg-secondary #FFFFFF, bg-surface #EEF1F8, text-primary #0A0F1E, text-secondary #3D4466, text-muted #9AA0B4, accent-primary #0057FF, text-accent #0042CC, border-subtle rgba(10,15,30,0.06), border-default rgba(10,15,30,0.12)

Output as a single :root CSS block plus [data-theme='dark'] override block. Then generate the matching tailwind.config.ts colors extension.`}
        />
        <PromptCard
          id="prompt-motion-token"
          tool={["Claude", "v0"]}
          title="Generate Motion Token CSS"
          whenToUse="When building any Enfactum React component that requires animation."
          prompt={`Generate a complete CSS motion token system for Enfactum Market Grammar design system.

Required tokens:

Easing:
--ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1.0)
--ease-exit: cubic-bezier(0.4, 0.0, 1.0, 1.0)
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1.0)

Duration:
--dur-instant: 0ms
--dur-fast: 100ms
--dur-base: 200ms
--dur-medium: 300ms
--dur-slow: 500ms
--dur-cinematic: 800ms

Then generate Tailwind config entries for these as transitionTimingFunction and transitionDuration extensions.

Rules to enforce in code comments:
- Never use spring physics or bounce easing
- Cards always use translateY(-3px) on hover
- Numbers count up from 0 on mount
- Sequential stagger = 40ms between items`}
        />
      </div>
    </SectionWrapper>
  );
}
