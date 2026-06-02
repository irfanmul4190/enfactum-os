import { useState, useEffect, useRef } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import posthog from "posthog-js";

export type ToolType = "Claude" | "Midjourney" | "v0" | "Gamma" | "ChatGPT" | "Gemini" | "Ideogram" | "Flux" | "DALL-E" | "Lovable" | "Canva";

const toolColors: Record<ToolType, { bg: string; text: string }> = {
  Claude: { bg: "bg-primary/15", text: "text-primary" },
  Midjourney: { bg: "bg-brand-violet/15", text: "text-brand-violet" },
  v0: { bg: "bg-brand-emerald/15", text: "text-brand-emerald" },
  Lovable: { bg: "bg-brand-emerald/15", text: "text-brand-emerald" },
  Gamma: { bg: "bg-brand-amber/15", text: "text-brand-amber" },
  ChatGPT: { bg: "bg-elevated", text: "text-muted" },
  Gemini: { bg: "bg-primary/15", text: "text-primary" },
  Ideogram: { bg: "bg-brand-violet/15", text: "text-brand-violet" },
  Flux: { bg: "bg-brand-amber/15", text: "text-brand-amber" },
  "DALL-E": { bg: "bg-brand-emerald/15", text: "text-brand-emerald" },
  Canva: { bg: "bg-brand-amber/15", text: "text-brand-amber" },
};

function highlightVariables(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span key={i} className="px-1 py-[1px] rounded-[3px] bg-primary/[0.08] text-primary font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Recently copied prompts stored in localStorage
const RECENT_KEY = "enfactum-recently-copied";

export function getRecentlyCopied(): { id: string; title: string; tool: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentlyCopied(id: string, title: string, tool: string) {
  const recent = getRecentlyCopied().filter((r) => r.id !== id);
  recent.unshift({ id, title, tool });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 3)));
  window.dispatchEvent(new CustomEvent("recent-copied-updated"));
}

interface PromptCardProps {
  tool: ToolType | ToolType[];
  title: string;
  whenToUse: string;
  prompt: string;
  id?: string;
}

export function PromptCard({ tool, title, whenToUse, prompt, id }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [brandCheckOpen, setBrandCheckOpen] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);
  const cardRef = useRef<HTMLDivElement>(null);
  const tools = Array.isArray(tool) ? tool : [tool];

  // Listen for pulse events (from Quick Create card clicks)
  useEffect(() => {
    if (!id) return;
    function handlePulse(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail === id) {
        setPulsing(true);
        setTimeout(() => setPulsing(false), 600);
      }
    }
    window.addEventListener("prompt-pulse", handlePulse);
    return () => window.removeEventListener("prompt-pulse", handlePulse);
  }, [id]);

  const deriveMetadata = () => {
    const isLight = id?.includes("light") ?? false;
    const section = isLight ? "light_presentations" : "dark_presentations";
    let page = "image_generation";
    if (id?.startsWith("prompt-copy")) page = "copy_templates";
    else if (id?.startsWith("prompt-design")) page = "design_generation";
    else if (id?.startsWith("prompt-deck")) page = "deck_generation";
    return { section, page };
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = prompt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (id) addRecentlyCopied(id, title, tools[0]);

    const { section, page } = deriveMetadata();
    posthog.capture("prompt_copied", {
      prompt_title: title,
      tool: tools[0].toLowerCase().replace("-", ""),
      section,
      page,
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleRate = (value: "up" | "down") => {
    const next = rating === value ? null : value;
    setRating(next);
    if (next) {
      const { section, page } = deriveMetadata();
      posthog.capture("prompt_rated", {
        rating: next,
        prompt_title: title,
        tool: tools[0].toLowerCase().replace("-", ""),
        section,
        page,
      });
    }
  };

  const charCount = prompt.length;
  const allChecked = checks.every(Boolean);

  const brandCheckLabels = [
    "Colors match #0057FF / #0A0F1E palette",
    "Font is IBM Plex Sans or IBM Plex Mono",
    "No unauthorised stock imagery",
    "Tone matches Voice & Tone guidelines",
  ];

  return (
    <div
      ref={cardRef}
      id={id}
      className={`bg-card border rounded-[10px] overflow-hidden scroll-mt-24 transition-all duration-300 ${
        pulsing ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {tools.map((t) => (
            <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${toolColors[t]?.bg || "bg-elevated"} ${toolColors[t]?.text || "text-muted"}`}>
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleRate("up")}
              className={`p-1 rounded transition-colors duration-150 ${
                rating === "up" ? "text-primary" : "text-muted hover:text-foreground"
              }`}
              aria-label="Thumbs up"
            >
              <ThumbsUp size={13} fill={rating === "up" ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => handleRate("down")}
              className={`p-1 rounded transition-colors duration-150 ${
                rating === "down" ? "text-primary" : "text-muted hover:text-foreground"
              }`}
              aria-label="Thumbs down"
            >
              <ThumbsDown size={13} fill={rating === "down" ? "currentColor" : "none"} />
            </button>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[12px] font-medium transition-all duration-200 ${
              copied
                ? "border-brand-emerald text-brand-emerald bg-brand-emerald/10"
                : "border-border text-muted hover:text-foreground hover:border-foreground/20"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied ✓" : "Copy Prompt"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <h4 className="text-[14px] font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-[12px] text-muted italic mb-3">{whenToUse}</p>
        <div className="border-t border-border pt-3">
          <pre className="font-mono-data text-[12px] text-text-secondary leading-[1.7] whitespace-pre-wrap">
            {highlightVariables(prompt)}
          </pre>
        </div>
        <div className="mt-2 text-[11px] font-mono-data text-muted">
          {charCount} characters
        </div>

        {/* Brand Check */}
        <div className="mt-3 pt-2 border-t border-border/50">
          <button
            onClick={() => setBrandCheckOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-150 ${
              allChecked ? "text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            <ChevronDown size={12} className={`transition-transform duration-200 ${brandCheckOpen ? "rotate-180" : ""}`} />
            {allChecked ? "Brand Check ✓" : "Brand Check"}
          </button>
          {brandCheckOpen && (
            <div className="mt-2 space-y-1.5 pl-[18px]">
              {brandCheckLabels.map((label, i) => (
                <label key={i} className="flex items-start gap-2 text-[11px] text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={() => {
                      const next = [...checks];
                      next[i] = !next[i];
                      setChecks(next);
                    }}
                    className="mt-[2px] rounded border-border accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
