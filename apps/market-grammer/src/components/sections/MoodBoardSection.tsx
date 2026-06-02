import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import posthog from "posthog-js";
import { SectionWrapper, SectionHeader, Eyebrow } from "../SectionParts";

import moodDeepArch from "@/assets/mood-deep-arch.jpg";
import moodGlassSteel from "@/assets/mood-glass-steel.jpg";
import moodUrbanDensity from "@/assets/mood-urban-density.jpg";
import moodMarketInfra from "@/assets/mood-market-infra.jpg";
import moodGeometricPrecision from "@/assets/mood-geometric-precision.jpg";
import light1 from "@/assets/light-1.jpg";
import light2 from "@/assets/light-2.jpg";
import light3 from "@/assets/light-3.jpg";
import lightDataTerrain from "@/assets/light-data-terrain.jpg";
import lightIntelligenceLayer from "@/assets/light-intelligence-layer.jpg";
import lightGrowthVector from "@/assets/light-growth-vector.jpg";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        const doCopy = async () => {
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };
        doCopy();
      }}
      className="flex items-center gap-1.5 text-[12px] text-primary hover:text-highlight transition-colors duration-200"
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy Prompt"}
    </button>
  );
}

const prompts = [
  {
    tab: "The Foundation (Data & Structure)",
    formula: "[Primary Object] + [Material] + [Lighting Constraint] + [Negative Constraints]",
    text: `A photorealistic macro shot of 3D geometric cubes arranged in a rigid, asymmetrical grid. The background is pure midnight blue (#0A0F1E) fading into black. The cubes are made of matte graphite and dark tinted glass. A single, sharp directional electric blue light (#2979FF) casts hard, defined shadows. Architectural rendering style, highly detailed. Exclude all people, gradients, soft lighting, glowing neon nodes, red colors, and organic shapes.`,
  },
  {
    tab: "The Pathway (Strategy & Flow)",
    formula: "[Intersecting Lines] + [Dark Void] + [Sharp Contrast] + [Minimalism]",
    text: `Abstract 3D structural lines and geometric pathways intersecting cleanly in a pitch-dark void. The primary colors are deep solid midnight blue and absolute black. Minimalist, brutalist design. Accents of sharp electric blue light hit the edges of the structures, casting hard shadows. Precise, mathematical, corporate minimalism. Exclude binary code, cybernetic themes, soft curves, people, and warm colors.`,
  },
  {
    tab: "The Monument (Scale & Authority)",
    formula: "[Brutalist Structure] + [Scale/Angle] + [Material] + [Cold Tone]",
    text: `A low-angle view of massive, minimalist brutalist architecture without any windows or human context. Intersecting solid concrete and dark steel planes. Deep, high-contrast shadows. The atmosphere is cold and corporate. A subtle, sharp electric blue reflection strikes a pane of dark glass. 8k resolution, highly realistic, structural focus. Exclude red tones, orange tones, natural landscapes, people, sky gradients, and soft watercolor effects.`,
  },
];

const lightCards = [
  { label: "Signal Flow", img: light1 },
  { label: "Market Pulse", img: light2 },
  { label: "Spectrum Shift", img: light3 },
  { label: "Data Terrain", img: lightDataTerrain },
  { label: "Intelligence Layer", img: lightIntelligenceLayer },
  { label: "Growth Vector", img: lightGrowthVector },
];

type MoodTab = "dark" | "light";

export function MoodBoardSection() {
  const [moodTab, setMoodTab] = useState<MoodTab>("dark");
  const [activePromptTab, setActivePromptTab] = useState(0);

  return (
    <SectionWrapper id="mood-board">
      <SectionHeader
        title={<>Visual Mood <span className="text-primary">Board</span></>}
        subtitle="The curated visual direction. Strict 3D geometric forms, abstract architectural details, solid colors over gradients, zero human subjects."
      />

      {/* Mood tab switcher */}
      <div className="flex gap-2 mb-6">
        {(["dark", "light"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setMoodTab(tab);
              posthog.capture("mood_board_tab_changed", { tab });
            }}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
              moodTab === tab
                ? "bg-primary text-primary-foreground"
                : "border border-border-subtle text-text-secondary hover:text-foreground"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            {tab === "dark" ? "Dark Presentations" : "Light Presentations"}
          </button>
        ))}
      </div>

      {/* Dark Presentations grid */}
      {moodTab === "dark" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {/* Row 1: 3 images */}
          {[
            { label: "Deep Architecture", img: moodDeepArch },
            { label: "Glass & Steel", img: moodGlassSteel },
            { label: "Urban Density", img: moodUrbanDensity },
          ].map((item) => (
            <div key={item.label} className="rounded-xl h-[200px] relative overflow-hidden flex items-end">
              <img src={item.img} alt={item.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <span className="relative z-10 text-[10px] text-white/80 p-3 bg-gradient-to-t from-black/60 to-transparent w-full">
                {item.label}
              </span>
            </div>
          ))}
          {/* Row 2: span-2 + 1 */}
          <div className="sm:col-span-2 rounded-xl relative overflow-hidden flex items-end" style={{ aspectRatio: "16/9" }}>
            <img src={moodMarketInfra} alt="Market Infrastructure" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative z-10 text-[10px] text-white/80 p-3 bg-gradient-to-t from-black/60 to-transparent w-full">
              Market Infrastructure
            </span>
          </div>
          <div className="rounded-xl h-[200px] sm:h-auto relative overflow-hidden flex items-end">
            <img src={moodGeometricPrecision} alt="Geometric Precision" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative z-10 text-[10px] text-white/80 p-3 bg-gradient-to-t from-black/60 to-transparent w-full">
              Geometric Precision
            </span>
          </div>
        </div>
      )}

      {/* Light Presentations grid */}
      {moodTab === "light" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {lightCards.map((card) => (
            <div key={card.label} className="flex flex-col gap-2">
              <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "3/2" }}>
                <img src={card.img} alt={card.label} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <span className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground">
                {card.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Rules — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="brand-card p-5 border-l-[3px] border-l-primary">
          <Eyebrow className="mb-3">Dark Presentation Rules</Eyebrow>
          <Eyebrow className="text-brand-emerald mb-2">Do Include</Eyebrow>
          <ul className="space-y-1.5 text-[13px] text-text-secondary mb-4">
            <li>• Midnight base (#0A0F1E) as primary bg</li>
            <li>• Single electric blue accent light source</li>
            <li>• Brutalist / architectural forms</li>
            <li>• High-contrast deep shadows</li>
            <li>• Abstract geometry, no human subjects</li>
          </ul>
          <Eyebrow className="text-destructive mb-2">Do Not Include</Eyebrow>
          <ul className="space-y-1.5 text-[13px] text-text-secondary">
            <li>• Warm tones (orange, red, yellow)</li>
            <li>• People or faces</li>
            <li>• Soft gradients or bokeh</li>
            <li>• Generic "tech" metaphors (server racks, binary code, glowing nodes)</li>
            <li>• Light or white backgrounds</li>
          </ul>
        </div>
        <div className="brand-card p-5 border-l-[3px] border-l-brand-violet">
          <Eyebrow className="mb-3">Light Presentation Rules</Eyebrow>
          <Eyebrow className="text-brand-emerald mb-2">Do Include</Eyebrow>
          <ul className="space-y-1.5 text-[13px] text-text-secondary mb-4">
            <li>• Vivid abstract color fields</li>
            <li>• Multi-color geometric or gradient forms</li>
            <li>• High energy, non-representational</li>
            <li>• Clean white or near-white canvas</li>
            <li>• Bold color contrast with clear focal point</li>
          </ul>
          <Eyebrow className="text-destructive mb-2">Do Not Include</Eyebrow>
          <ul className="space-y-1.5 text-[13px] text-text-secondary">
            <li>• People, faces, hands</li>
            <li>• Recognisable corporate environments</li>
            <li>• Stock technology imagery</li>
            <li>• Single-color flat fills (must have depth or gradient)</li>
            <li>• Any image that could belong to a generic B2B brand</li>
          </ul>
        </div>
      </div>

      {/* Gemini prompts */}
      <div className="mb-10">
        <Eyebrow className="mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-primary" /> Gemini Prompt Frameworks
        </Eyebrow>
        <p className="text-[13px] text-text-secondary mb-4">
          Because Enfactum's visual identity relies on strict abstract geometry and pure dark tones, generative AI models will naturally add unwanted 'friendly' elements. Use these engineered prompt formulas to force the model into our exact structural aesthetic.
        </p>

        <div className="flex gap-2 mb-3">
          {prompts.map((p, i) => (
            <button
              key={p.tab}
              onClick={() => setActivePromptTab(i)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                activePromptTab === i ? "bg-primary text-primary-foreground" : "bg-elevated text-text-secondary hover:text-foreground"
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
            >
              {p.tab}
            </button>
          ))}
        </div>

        <div className="brand-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono-data text-muted">{prompts[activePromptTab].formula}</span>
            <CopyButton text={prompts[activePromptTab].text} />
          </div>
          <pre className="font-mono-data text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">
            {prompts[activePromptTab].text}
          </pre>
        </div>
      </div>

      {/* Negative prompt */}
      <div className="bg-brand-midnight rounded-xl p-5">
        <Eyebrow className="text-brand-neutral-400 mb-2">Negative Prompt Cheat Sheet</Eyebrow>
        <pre className="font-mono-data text-[12px] text-brand-neutral-200 leading-relaxed whitespace-pre-wrap">
          Exclude: people, human subjects, faces, hands, red, orange, warm colors, soft gradients, watercolor effects, glowing neon nodes, floating particles, binary code, cybernetic themes, friendly corporate art.
        </pre>
      </div>
    </SectionWrapper>
  );
}
