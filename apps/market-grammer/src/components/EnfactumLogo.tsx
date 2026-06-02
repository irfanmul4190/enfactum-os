// Thin re-export — canonical implementation lives in @repo/ui/enfactum-logo.
// Existing market-grammer consumers (BrandSidebar, LogoGuidelinesSection)
// keep their import paths unchanged.
import { EnfactumLogo as SharedLogo, FactMark } from "@repo/ui/enfactum-logo";

export const EnfactumLogo = SharedLogo;
export const SymbolMark = FactMark;

// Back-compat alias retained for the brand-book section that uses a text-only
// rendering of the wordmark on themed surfaces.
export function MonochromeMark({
  size = 24,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <span
      className={`font-bold tracking-tight text-foreground ${className}`}
      style={{ fontSize: size }}
    >
      enfactum
    </span>
  );
}
