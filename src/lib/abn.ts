/**
 * Australian Business Number (ABN) validation.
 * Implements the ATO weighted-checksum algorithm.
 * https://abr.business.gov.au/Help/AbnFormat
 */
const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export function normaliseAbn(abn: string): string {
  return (abn ?? "").replace(/\s+/g, "");
}

export function formatAbn(abn: string): string {
  const n = normaliseAbn(abn);
  if (n.length !== 11) return abn;
  return `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8, 11)}`;
}

export function isValidAbn(abn: string): boolean {
  const n = normaliseAbn(abn);
  if (!/^\d{11}$/.test(n)) return false;
  // Subtract 1 from the first digit, then weighted sum mod 89 must be 0.
  const digits = n.split("").map(Number);
  digits[0] -= 1;
  const sum = digits.reduce((acc, d, i) => acc + d * WEIGHTS[i], 0);
  return sum % 89 === 0;
}

export interface AbnCheckResult {
  valid: boolean;
  formatted: string;
  reason?: string;
}

export function checkAbn(abn: string): AbnCheckResult {
  const n = normaliseAbn(abn);
  if (!n) return { valid: false, formatted: "", reason: "ABN is required" };
  if (!/^\d+$/.test(n)) return { valid: false, formatted: abn, reason: "ABN must contain digits only" };
  if (n.length !== 11) return { valid: false, formatted: abn, reason: `ABN must be 11 digits (got ${n.length})` };
  if (!isValidAbn(n)) return { valid: false, formatted: formatAbn(n), reason: "ABN failed checksum" };
  return { valid: true, formatted: formatAbn(n) };
}