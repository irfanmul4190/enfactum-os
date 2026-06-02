import { Check, X } from "lucide-react";
import {
  Menu, Search, Settings, Home, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronDown,
  User, Bell, Mail, Shield, Link, Database, Cloud, Lock,
  BarChart2, TrendingUp, PieChart, Activity, Target, Zap, Globe, Map, Crosshair
} from "lucide-react";
import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";

import visualPrimary3d from "@/assets/visual-primary-3d.jpg";
import visualMarketArch from "@/assets/visual-market-arch.jpg";
import visualStructural from "@/assets/visual-structural.jpg";
import visualGeometricIntersect from "@/assets/visual-geometric-intersect.jpg";
import visualLinearSignal from "@/assets/visual-linear-signal.jpg";

function IconGrid({ label, icons }: { label: string; icons: { icon: React.ElementType; name: string }[] }) {
  return (
    <div className="mb-6">
      <Eyebrow className="mb-3">{label}</Eyebrow>
      <div className="flex flex-wrap gap-4">
        {icons.map(({ icon: Icon, name }) => (
          <div key={name} className="flex flex-col items-center gap-1.5 w-16">
            <div className="w-10 h-10 bg-elevated rounded-lg flex items-center justify-center transition-colors duration-200">
              <Icon size={20} className="text-foreground" />
            </div>
            <span className="text-[10px] text-muted">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="bg-elevated dark:bg-brand-neutral-700 border border-border-subtle rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors duration-200 min-h-[100px]">
      <Crosshair size={16} className="text-muted opacity-40" />
      <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted">{name}</span>
      <span className="text-[10px] text-text-secondary text-center">{description}</span>
    </div>
  );
}

export function VisualStyleSection() {
  return (
    <SectionWrapper id="visual-style">
      <SectionHeader
        title={<>Visual <span className="text-primary">Style</span></>}
        subtitle="Immersive, geometric, and structured. This section covers photography selection, iconography rules, graphic elements, and how to commission or generate on-brand imagery."
      />

      {/* Photography principles */}
      <Eyebrow className="mb-2">Photography & Imagery Principles</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">
        Our imagery revolves around 3D abstract geometric forms and architectural structures. We strictly avoid literal people-in-action in favor of immersive environments that convey scale, precision, and market density.
      </p>
      <div className="border-l-2 border-primary bg-surface rounded-r-xl p-5 mb-6">
        <Eyebrow className="text-primary mb-2">How to Select or Commission Imagery</Eyebrow>
        <ol className="space-y-1.5 text-[13px] text-text-secondary list-decimal list-inside">
          <li>Search for "3D geometric architecture dark" or "brutalist abstract midnight blue" — never "team collaboration" or "handshake."</li>
          <li>Filter for images with dominant cool tones (blue, midnight, steel gray). Reject anything with warm tones (red, orange, yellow).</li>
          <li>Confirm no people, faces, or hands appear anywhere in the image — including reflections.</li>
          <li>The image should evoke "infrastructure" or "system" — not "lifestyle" or "aspiration."</li>
          <li>For AI generation, use the Gemini Prompt Frameworks in the Mood Board section.</li>
        </ol>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Primary 3D Elements — Immersive, abstract 3D blocks and market infrastructure.", img: visualPrimary3d },
          { label: "Market Architecture — Expansive structural environments suggesting infinite scale.", img: visualMarketArch },
          { label: "Structural Patterns — Repeating geometric patterns reinforcing stability and signal capture.", img: visualStructural },
        ].map(({ label, img }) => (
          <div key={label} className="bg-brand-midnight rounded-xl h-[300px] relative overflow-hidden flex items-end">
            <img src={img} alt={label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative z-10 text-[11px] text-white/80 leading-snug p-4 bg-gradient-to-t from-black/60 to-transparent w-full">{label}</span>
          </div>
        ))}
      </div>

      {/* Secondary */}
      <Eyebrow className="mb-4">Secondary Abstractions</Eyebrow>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {[
          { label: "Geometric Intersections — Wireframe-like abstractions representing signal flow.", img: visualGeometricIntersect },
          { label: "Linear Signal & Light — Luminescent lines representing territory architecture and data density.", img: visualLinearSignal },
        ].map(({ label, img }) => (
          <div key={label} className="bg-brand-midnight rounded-xl h-[200px] relative overflow-hidden flex items-end">
            <img src={img} alt={label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative z-10 text-[11px] text-white/80 leading-snug p-4 bg-gradient-to-t from-black/60 to-transparent w-full">{label}</span>
          </div>
        ))}
      </div>

      {/* Imagery Do/Don't */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-emerald mb-3 flex items-center gap-2"><Check size={14} /> Do Include</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> 3D geometric objects: cubes, spheres, sharp crystalline edges</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Abstract brutalist architecture, macro material textures</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> High-contrast shadows with pure black/midnight tones</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Electric Blue (#2979FF) as accent or focal light source</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-brand-emerald mt-0.5 shrink-0" /> Aerial views of urban density (Singapore, Bangkok skylines)</li>
          </ul>
        </div>
        <div className="brand-card p-5">
          <h4 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-destructive mb-3 flex items-center gap-2"><X size={14} /> Never Include</h4>
          <ul className="space-y-2 text-[13px] text-text-secondary">
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> People, faces, hands, or human silhouettes</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Red, orange, or warm color palettes</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Soft gradients, watercolor, or organic flowing shapes</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> "Tech" clichés: floating nodes, binary code, circuit boards</li>
            <li className="flex items-start gap-2"><X size={14} className="text-destructive mt-0.5 shrink-0" /> Stock photography of any kind</li>
          </ul>
        </div>
      </div>

      {/* Graphic elements */}
      <Eyebrow className="mb-2">Graphic Elements</Eyebrow>
      <p className="text-[13px] text-text-secondary mb-4">
        Clean, rigid, strictly geometric vector elements used to frame content, create hierarchy, and add visual rhythm. Built on a 4px grid.
      </p>
      <div className="grid grid-cols-4 gap-3 mb-10">
        <PlaceholderCard name="Nested Squares" description="Concentric squares implying depth and layered analysis" />
        <PlaceholderCard name="Grid Matrix" description="Dot grid representing data density and signal capture" />
        <PlaceholderCard name="Stepped Progress" description="Ascending blocks showing pipeline stages" />
        <PlaceholderCard name="Crosshair Anchor" description="Precision target for focal emphasis" />
      </div>

      {/* Iconography */}
      <div className="brand-card p-6">
        <h4 className="text-[15px] font-semibold text-foreground mb-1">Complete Iconography Set</h4>
        <p className="text-[13px] text-text-secondary mb-2">Icons from Lucide, built on a strict 24px grid with a consistent 2px stroke. Sharp geometries match IBM Plex Sans.</p>
        <div className="border-l-2 border-primary bg-surface rounded-r-xl p-4 mb-5">
          <Eyebrow className="text-primary mb-1.5">How to Use Icons</Eyebrow>
          <ul className="text-[12px] text-text-secondary space-y-1">
            <li>• Default size: 20px for inline, 24px for standalone, 16px for compact/sidebar</li>
            <li>• Color: always inherit from text color. Never hardcode icon colors.</li>
            <li>• Stroke: 2px (Lucide default). Never modify stroke weight.</li>
            <li>• Spacing: 8px gap between icon and adjacent text label</li>
          </ul>
        </div>

        <IconGrid label="Navigation & Interface" icons={[
          { icon: Menu, name: "Menu" }, { icon: Search, name: "Search" },
          { icon: Settings, name: "Settings" }, { icon: Home, name: "Home" },
          { icon: ArrowRight, name: "ArrowRight" }, { icon: ArrowLeft, name: "ArrowLeft" },
          { icon: ArrowUp, name: "ArrowUp" }, { icon: ArrowDown, name: "ArrowDown" },
          { icon: ChevronRight, name: "ChevronRight" }, { icon: ChevronDown, name: "ChevronDown" },
        ]} />
        <IconGrid label="Core Concepts" icons={[
          { icon: User, name: "User" }, { icon: Bell, name: "Bell" }, { icon: Mail, name: "Mail" },
          { icon: Shield, name: "Shield" }, { icon: Link, name: "Link" },
          { icon: Database, name: "Database" }, { icon: Cloud, name: "Cloud" }, { icon: Lock, name: "Lock" },
        ]} />
        <IconGrid label="Data & Analytics" icons={[
          { icon: BarChart2, name: "BarChart2" }, { icon: TrendingUp, name: "TrendingUp" },
          { icon: PieChart, name: "PieChart" }, { icon: Activity, name: "Activity" },
          { icon: Target, name: "Target" }, { icon: Zap, name: "Zap" },
          { icon: Globe, name: "Globe" }, { icon: Map, name: "Map" },
        ]} />
      </div>
    </SectionWrapper>
  );
}
