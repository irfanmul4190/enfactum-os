// MDF (Market Development Fund) eligibility detection and constants

export const PRODUCT_LINE_OPTIONS = [
  'HP', 'Lenovo', 'HP ProLiant', 'HP Aruba', 'HP Networking',
  'Lenovo ThinkSystem', 'Lenovo ThinkAgile', 'Microsoft', 'VMware',
  'Custom Services', 'Other',
] as const;

export type ProductLine = typeof PRODUCT_LINE_OPTIONS[number];

const MDF_ELIGIBLE_PRODUCTS = new Set<string>([
  'HP', 'Lenovo', 'HP ProLiant', 'HP Aruba', 'Lenovo ThinkSystem', 'Lenovo ThinkAgile',
]);

/**
 * Checks if a deal qualifies for MDF based on account vendor flags and product lines.
 */
export function detectMdfEligibility(
  vendorFlags: Record<string, boolean> | null | undefined,
  productLines: string[] | null | undefined,
): boolean {
  // Check vendor flags
  if (vendorFlags) {
    if (vendorFlags.hp === true || vendorFlags.lenovo === true) return true;
  }
  // Check product lines
  if (Array.isArray(productLines)) {
    for (const pl of productLines) {
      if (MDF_ELIGIBLE_PRODUCTS.has(pl)) return true;
    }
  }
  return false;
}
