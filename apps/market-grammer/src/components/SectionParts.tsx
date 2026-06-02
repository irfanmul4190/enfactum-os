import { type ReactNode, useState } from "react";
import { Copy, Check } from "lucide-react";

export function SectionWrapper({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className="scroll-mt-16 pb-16 border-b border-border last:border-b-0"
    >
      {children}
    </section>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: ReactNode; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[38px] font-bold leading-tight text-foreground">{title}</h1>
        {action}
      </div>
      <p className="mt-3 text-[16px] text-text-secondary leading-relaxed max-w-[720px]">{subtitle}</p>
    </div>
  );
}

/** Clickable token that copies its value to clipboard. Use for hex codes, easing curves, durations, etc. */
export function CopyToken({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`group/token inline-flex items-center gap-1 font-mono-data hover:text-primary transition-colors duration-200 cursor-pointer ${className}`}
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
      title={`Copy: ${value}`}
    >
      {value}
      {copied
        ? <Check size={11} className="text-brand-emerald shrink-0" />
        : <Copy size={11} className="opacity-0 group-hover/token:opacity-60 transition-opacity shrink-0" />}
    </button>
  );
}

/** Eyebrow / section label — 10px SemiBold uppercase 0.12em tracking */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[10px] font-semibold tracking-[0.12em] uppercase text-muted ${className}`}>
      {children}
    </div>
  );
}
