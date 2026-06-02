import React, { useRef, useEffect, useState } from 'react';

interface ScaledSlideProps {
  children: React.ReactNode;
  className?: string;
}

export function ScaledSlide({ children, className = '' }: ScaledSlideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const s = Math.min(width / 1920, height / 1080);
      setScale(s);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={{ minHeight: 200 }}>
      <div
        className="absolute"
        style={{
          width: 1920,
          height: 1080,
          left: '50%',
          top: '50%',
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
