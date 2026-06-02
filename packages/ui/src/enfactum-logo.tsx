/**
 * Canonical Enfactum brand mark. Replaces the per-app PNG files that had
 * drifted across financing-hub, profit-navigator, and market-grammer. WEBP
 * assets are lifted from market-grammer's original brand-book treatment.
 *
 * Variants:
 *   - "auto" (default) — swaps light/dark variants via Tailwind's `dark:` modifier.
 *     Works in any app that uses Tailwind's class-based dark mode (all 5 SPAs).
 *   - "light"           — black "en/um" + blue "fact". Use on light surfaces only.
 *   - "dark"            — white "en/um" + blue "fact". Use on dark surfaces.
 *   - "mono"            — forced-white via CSS filter. Use on backgrounds where
 *                         neither light nor dark variant has enough contrast
 *                         (e.g. coloured gradient splash screens).
 */
import logoLight from "./assets/enfactum-logo.webp";
import logoDark from "./assets/enfactum-logo-dark.webp";
import factMark from "./assets/enfactum-fact-mark.webp";

export type LogoVariant = "auto" | "light" | "dark" | "mono";

export interface EnfactumLogoProps {
  /** Pixel height. Width auto-scales to preserve aspect ratio. */
  size?: number;
  variant?: LogoVariant;
  className?: string;
}

export function EnfactumLogo({
  size = 24,
  variant = "auto",
  className = "",
}: Readonly<EnfactumLogoProps>) {
  if (variant === "auto") {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        style={{ height: size }}
      >
        <img
          src={logoLight}
          alt="Enfactum"
          style={{ height: size, width: "auto" }}
          className="block dark:hidden select-none"
          draggable={false}
        />
        <img
          src={logoDark}
          alt="Enfactum"
          style={{ height: size, width: "auto" }}
          className="hidden dark:block select-none"
          draggable={false}
        />
      </span>
    );
  }

  if (variant === "mono") {
    return (
      <img
        src={logoLight}
        alt="Enfactum"
        style={{
          height: size,
          width: "auto",
          filter: "brightness(0) invert(1)",
        }}
        className={`select-none ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <img
      src={variant === "dark" ? logoDark : logoLight}
      alt="Enfactum"
      style={{ height: size, width: "auto" }}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}

/** "fact" symbol mark on its own, sized like a glyph. */
export function FactMark({
  size = 24,
  className = "",
}: Readonly<{ size?: number; className?: string }>) {
  return (
    <img
      src={factMark}
      alt="fact"
      style={{ height: size, width: "auto" }}
      className={`inline-block select-none ${className}`}
      draggable={false}
    />
  );
}
