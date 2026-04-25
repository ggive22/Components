/**
 * Format an amount in CFA Franc (XOF) using French spacing.
 * 12500 -> "12 500 CFA"
 */
export const formatXof = (amount: number): string => {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} CFA`;
};

/**
 * Slugify a product name for URL usage.
 */
export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

/**
 * Normalize a Togo phone number for wa.me links.
 * Accepts forms like "+228 90 12 34 56", "90123456", "+22890123456".
 * Returns digits only with country code (228 if missing).
 */
export const normalizeTogoPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("228")) return digits;
  if (digits.length === 8) return `228${digits}`;
  return digits;
};

/**
 * Validate a Togo WhatsApp number: 8 digits, optionally prefixed with 228.
 */
export const isValidTogoPhone = (raw: string): boolean => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("228")) return digits.length === 11;
  return digits.length === 8;
};
