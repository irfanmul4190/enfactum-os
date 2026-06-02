import { useState, useRef, useCallback } from "react";
import { Columns2, X, Sun, Moon, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeComparatorProps {
  children: React.ReactNode;
}

/**
 * Renders the children twice — once clipped to the left half (dark),
 * once clipped to the right half (light) — with a draggable divider.
 * A floating toggle button activates / deactivates the mode.
 */
export function ThemeComparator({ children }: ThemeComparatorProps) {
  const [active, setActive] = useState(false);
  const [splitPct, setSplitPct] = useState(20);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const move = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.max(10, Math.min(90, pct)));
    };

    const up = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(10, Math.min(90, pct)));
  }, []);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen">
      {active ? (
        <>
          {/* ── Dark side (left) ── */}
          <div
            className="dark absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
          >
            <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }}>
              {children}
            </div>
          </div>

          {/* ── Light side (right) ── */}
          <div
            className="light absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${splitPct}%)` }}
          >
            <div style={{ background: "hsl(var(--background))", minHeight: "100vh" }}>
              {children}
            </div>
          </div>

          {/* ── Draggable divider ── */}
          <div
            className="absolute top-0 bottom-0 z-50 flex items-center justify-center cursor-col-resize select-none"
            style={{ left: `calc(${splitPct}% - 20px)`, width: 40 }}
            onMouseDown={onMouseDown}
            onTouchMove={onTouchMove}
          >
            {/* Vertical line */}
            <div
              className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
              style={{ background: "hsl(var(--primary))", boxShadow: "0 0 12px hsl(var(--primary) / 0.6)" }}
            />

            {/* Handle pill */}
            <div
              className="relative z-10 flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl shadow-lg select-none"
              style={{
                background: "hsl(var(--primary))",
                boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 4px 12px hsl(0 0% 0% / 0.4)",
              }}
            >
              <Moon className="w-3 h-3 text-white" />
              <GripVertical className="w-3.5 h-3.5 text-white" />
              <Sun className="w-3 h-3 text-white" />
            </div>

            {/* Labels */}
            <div className="absolute top-4 right-full mr-3 flex items-center gap-1.5 pointer-events-none">
              <Moon className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
              >
                Dark
              </span>
            </div>
            <div className="absolute top-4 left-full ml-3 flex items-center gap-1.5 pointer-events-none">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "hsl(38 90% 55% / 0.15)", color: "hsl(38 90% 55%)", border: "1px solid hsl(38 90% 55% / 0.3)" }}
              >
                Light
              </span>
              <Sun className="w-3 h-3" style={{ color: "hsl(38 90% 55%)" }} />
            </div>
          </div>
        </>
      ) : (
        /* Normal render */
        children
      )}

      {/* ── Floating toggle button ── */}
      <button
        onClick={() => setActive(a => !a)}
        className={cn(
          "fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 select-none",
          active
            ? "shadow-[0_0_24px_hsl(var(--primary)/0.5)]"
            : "hover:scale-105 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
        )}
        style={{
          background: active
            ? "hsl(var(--negative) / 0.15)"
            : "var(--gradient-primary)",
          border: active
            ? "1px solid hsl(var(--negative) / 0.35)"
            : "1px solid hsl(var(--primary) / 0.4)",
          color: active ? "hsl(var(--negative))" : "hsl(var(--primary-foreground))",
          boxShadow: active
            ? "0 4px 20px hsl(var(--negative) / 0.2)"
            : "0 4px 20px hsl(210 100% 58% / 0.4)",
          backdropFilter: "blur(12px)",
        }}
        title={active ? "Exit compare mode" : "Compare dark / light themes"}
      >
        {active ? (
          <>
            <X className="w-4 h-4" /> Exit Compare
          </>
        ) : (
          <>
            <Columns2 className="w-4 h-4" />
            <Moon className="w-3.5 h-3.5 -mr-0.5" />
            <span className="opacity-50">/</span>
            <Sun className="w-3.5 h-3.5 -ml-0.5" />
            Compare Themes
          </>
        )}
      </button>
    </div>
  );
}
