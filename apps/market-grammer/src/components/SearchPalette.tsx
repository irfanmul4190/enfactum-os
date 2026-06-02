import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { navSections } from "./navData";

/** Searchable entries: each section + sub-topics with keywords */
interface SearchEntry {
  id: string;
  section: string;
  group: string;
  title: string;
  keywords: string[];
}

const searchIndex: SearchEntry[] = [
  { id: "brand-story", section: "Brand Story", group: "Identity", title: "Brand Story", keywords: ["origin", "positioning", "density", "clarity", "precision", "trust", "locality", "advantage", "bloomberg", "sea", "southeast asia", "gtm", "three truths", "mission", "vision"] },
  { id: "brand-story", section: "Brand Story", group: "Identity", title: "Positioning Statement", keywords: ["bloomberg terminal", "dense", "precise", "locally fluent", "tagline", "slogan"] },
  { id: "logo-guidelines", section: "Logo Guidelines", group: "Identity", title: "Logo Guidelines", keywords: ["wordmark", "logo", "enfactum", "symbol", "favicon", "monochrome", "download"] },
  { id: "logo-guidelines", section: "Logo Guidelines", group: "Identity", title: "Logo Clear Space", keywords: ["clearspace", "spacing", "cap height", "minimum size", "proportions"] },
  { id: "logo-guidelines", section: "Logo Guidelines", group: "Identity", title: "Logo Usage Rules", keywords: ["do", "don't", "stretch", "skew", "rotate", "shadow", "background"] },
  { id: "color-system", section: "Color System", group: "Identity", title: "Brand Blues", keywords: ["#0057FF", "brand blue", "#2979FF", "electric blue", "#0042CC", "blue-600", "#002E99", "blue-700", "#000D33", "blue-900", "accent", "button", "link", "hover"] },
  { id: "color-system", section: "Color System", group: "Identity", title: "Neutrals", keywords: ["#0A0F1E", "midnight", "#0D1020", "#141829", "#252A47", "#6B7290", "#C8CDD9", "#FFFFFF", "background", "surface", "elevated", "muted", "dark mode"] },
  { id: "color-system", section: "Color System", group: "Identity", title: "Capability Accents", keywords: ["signal blue", "territory violet", "#7C3AED", "conversion emerald", "#059669", "market amber", "#D97706", "pillar", "badge", "icon container"] },
  { id: "color-system", section: "Color System", group: "Identity", title: "Color Application Rules", keywords: ["dark mode", "light mode", "gradient", "opacity", "border", "rgba"] },
  { id: "typography", section: "Typography", group: "Identity", title: "Typography", keywords: ["ibm plex sans", "ibm plex mono", "ibm plex serif", "font", "typeface", "weight"] },
  { id: "typography", section: "Typography", group: "Identity", title: "Type Scale", keywords: ["display", "heading", "body", "mono-data", "72px", "56px", "40px", "32px", "18px", "16px", "14px", "size", "hierarchy"] },
  { id: "typography", section: "Typography", group: "Identity", title: "Selective Word Highlighting", keywords: ["highlight", "electric blue", "bold", "headline", "emphasis", "color word"] },
  { id: "visual-style", section: "Visual Style", group: "Visual Language", title: "Visual Style", keywords: ["photography", "imagery", "3d", "geometric", "architecture", "abstract", "immersive"] },
  { id: "visual-style", section: "Visual Style", group: "Visual Language", title: "Iconography System", keywords: ["icon", "lucide", "24px", "2px stroke", "grid", "navigation", "data", "analytics"] },
  { id: "visual-style", section: "Visual Style", group: "Visual Language", title: "Graphic Elements", keywords: ["nested squares", "grid matrix", "stepped progress", "crosshair", "vector", "geometric"] },
  { id: "mood-board", section: "Mood Board", group: "Visual Language", title: "Visual Mood Board", keywords: ["mood", "direction", "deep architecture", "signal grid", "glass steel", "urban density", "terminal data"] },
  { id: "mood-board", section: "Mood Board", group: "Visual Language", title: "Gemini Prompt Frameworks", keywords: ["gemini", "ai", "prompt", "negative prompt", "generative", "midjourney", "stable diffusion", "foundation", "pathway", "monument"] },
  { id: "mood-board", section: "Mood Board", group: "Visual Language", title: "Photography Rules", keywords: ["do", "don't", "people", "faces", "warm colors", "red", "orange", "shadows", "cubes"] },
  { id: "motion", section: "Motion & Animation", group: "Visual Language", title: "Easing Curves", keywords: ["cubic-bezier", "decelerate", "accelerate", "standard", "easing", "animation", "transition"] },
  { id: "motion", section: "Motion & Animation", group: "Visual Language", title: "Duration Scale", keywords: ["instant", "fast", "base", "medium", "slow", "cinematic", "0ms", "100ms", "200ms", "300ms", "500ms", "800ms", "timing"] },
  { id: "motion", section: "Motion & Animation", group: "Visual Language", title: "Motion Principles", keywords: ["stagger", "count up", "glow", "hover", "lift", "translateY", "shadow", "pulse", "sequential"] },
  { id: "voice-tone", section: "Voice & Tone", group: "Voice", title: "Voice & Tone", keywords: ["authoritative", "precise", "locally fluent", "data-dense", "register", "writing", "copy"] },
  { id: "linkedin", section: "LinkedIn Playbook", group: "Voice", title: "LinkedIn Playbook", keywords: ["linkedin", "social", "post", "format", "engagement", "content", "social media"] },
  { id: "ui-components", section: "UI Components", group: "Product", title: "UI Components", keywords: ["button", "input", "badge", "card", "component", "design system", "form"] },
  { id: "data-viz", section: "Data Visualization", group: "Product", title: "Data Visualization", keywords: ["chart", "graph", "bar", "line", "pie", "metric", "dashboard", "recharts"] },
  { id: "interaction", section: "Interaction States", group: "Product", title: "Interaction States", keywords: ["hover", "active", "focus", "disabled", "loading", "error", "state", "feedback"] },
  { id: "sea-market", section: "SEA Market Adaptation", group: "Application", title: "SEA Market Adaptation", keywords: ["southeast asia", "localization", "thai", "bahasa", "vietnamese", "tagalog", "multi-script", "market", "adaptation"] },
  { id: "ppt-templates", section: "PPT Templates", group: "Application", title: "PPT Templates", keywords: ["powerpoint", "presentation", "slide", "template", "deck", "pitch"] },
];

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function SearchPalette({ open, onClose, onNavigate }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // toggle handled by parent
      }
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const terms = q.split(/\s+/);

    return searchIndex
      .map((entry) => {
        const haystack = [entry.title, entry.section, entry.group, ...entry.keywords].join(" ").toLowerCase();
        const score = terms.reduce((acc, term) => {
          if (entry.title.toLowerCase().includes(term)) return acc + 3;
          if (entry.keywords.some((k) => k.includes(term))) return acc + 2;
          if (haystack.includes(term)) return acc + 1;
          return acc;
        }, 0);
        return { ...entry, score };
      })
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [query]);

  // Deduplicate by id+title
  const uniqueResults = useMemo(() => {
    const seen = new Set<string>();
    return results.filter((r) => {
      const key = `${r.id}::${r.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [results]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, uniqueResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && uniqueResults[selectedIndex]) {
      onNavigate(uniqueResults[selectedIndex].id);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[560px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search brand guidelines..."
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono-data text-muted border border-border rounded">
            ESC
          </kbd>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors sm:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted">Type to search across all brand guidelines</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {["#0057FF", "typography", "motion", "logo", "dark mode", "easing"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-[11px] font-medium text-text-secondary bg-elevated rounded-md hover:text-foreground transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : uniqueResults.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted">No results for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {uniqueResults.map((result, i) => (
                <button
                  key={`${result.id}-${result.title}`}
                  onClick={() => { onNavigate(result.id); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedIndex === i ? "bg-elevated" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{result.title}</div>
                    <div className="text-[11px] text-muted truncate">{result.group} → {result.section}</div>
                  </div>
                  <ArrowRight size={14} className={`shrink-0 text-muted transition-opacity ${selectedIndex === i ? "opacity-100" : "opacity-0"}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {uniqueResults.length > 0 && (
          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border rounded font-mono-data">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border rounded font-mono-data">↵</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-border rounded font-mono-data">esc</kbd> close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
