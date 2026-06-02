const CURRENCY_PREFIXES: Record<string, string> = {
  SGD: "SG$",
  USD: "US$",
  INR: "₹",
  MYR: "RM",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  THB: "฿",
  JPY: "¥",
  AUD: "A$",
};

/**
 * Canonical money formatter. Never produces bare "$".
 * - SGD → "SG$ 120,000"
 * - USD → "US$ 45,000"
 * - Others → prefix from map or "CUR " fallback
 */
export function fmtMoney(amount: number, currency = "SGD", opts?: { decimals?: number }): string {
  const prefix = CURRENCY_PREFIXES[currency] || `${currency} `;
  const decimals = opts?.decimals ?? 0;
  const formatted = new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${prefix} ${formatted}`;
}

/** @deprecated Use fmtMoney instead. Kept for backwards compat — now delegates to fmtMoney. */
export function fmtCurrency(value: number, currency = "SGD"): string {
  return fmtMoney(value, currency);
}

export function fmtPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
