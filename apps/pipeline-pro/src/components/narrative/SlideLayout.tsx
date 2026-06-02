import React from 'react';

interface SlideLayoutProps {
  children: React.ReactNode;
  slideNumber: number;
  totalSlides: number;
}

export function SlideLayout({ children, slideNumber, totalSlides }: SlideLayoutProps) {
  return (
    <div className="slide-content relative w-[1920px] h-[1080px] bg-[hsl(220,20%,10%)] text-[hsl(210,20%,92%)] overflow-hidden">
      {/* Top brand stripe */}
      <div className="absolute top-0 left-0 right-0 h-[6px] bg-[hsl(210,100%,56%)]" />

      {/* Content */}
      <div className="absolute inset-0 pt-[6px]">
        {children}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-[48px] flex items-center justify-between px-[60px] border-t border-[hsl(220,12%,20%)]">
        <div className="flex items-baseline gap-0 select-none">
          <span className="text-[14px] font-bold tracking-tight text-[hsl(210,20%,92%)]">en</span>
          <span className="text-[14px] font-bold tracking-tight text-[hsl(210,100%,56%)]">fact</span>
          <span className="text-[14px] font-bold tracking-tight text-[hsl(210,20%,92%)]">um</span>
        </div>
        <span className="text-[12px] text-[hsl(215,12%,55%)] font-mono">
          {slideNumber} / {totalSlides}
        </span>
      </div>
    </div>
  );
}
