import { useEffect, useState } from "react";
import { EnfactumLogo } from "@repo/ui/enfactum-logo";

interface SplashScreenProps {
  children: React.ReactNode;
}

export function SplashScreen({ children }: SplashScreenProps) {
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), 1600);
    const doneTimer = setTimeout(() => setPhase("done"), 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <>
      {phase !== "done" && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(145deg, hsl(222 30% 7%), hsl(220 28% 10%))",
            opacity: phase === "fading" ? 0 : 1,
            transition: phase === "fading" ? "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            pointerEvents: phase === "fading" ? "none" : "all",
          }}
        >
          <div
            className="absolute w-72 h-72 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(210 100% 58% / 0.12) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="relative flex flex-col items-center gap-6"
            style={{ animation: "splash-rise 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
          >
            <EnfactumLogo size={48} variant="mono" />
            <p
              className="text-xs font-semibold uppercase tracking-[0.25em]"
              style={{
                color: "hsl(215 15% 52%)",
                animation: "splash-rise 0.7s 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              Margin Manager
            </p>
            <div
              className="w-32 h-0.5 rounded-full overflow-hidden"
              style={{ background: "hsl(220 18% 20%)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, hsl(210 100% 58%), hsl(235 90% 68%))",
                  boxShadow: "0 0 8px hsl(210 100% 58% / 0.6)",
                  animation: "splash-bar 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          opacity: phase === "visible" ? 0 : 1,
          transition: phase !== "visible" ? "opacity 0.4s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
