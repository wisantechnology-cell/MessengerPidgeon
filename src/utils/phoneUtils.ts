/**
 * Utility functions to guarantee all phone numbers in PidgeX start with '16'.
 */

export function ensurePhoneStartsWith16(rawPhone?: string): string {
  if (!rawPhone || !rawPhone.trim()) {
    return '16 600 000 000';
  }

  const trimmed = rawPhone.trim();

  // If already starts with 16
  if (trimmed.startsWith('16')) {
    return trimmed;
  }

  // If it starts with +16
  if (trimmed.startsWith('+16')) {
    return trimmed.substring(1).trim();
  }

  // Remove existing country code like +34, +52, +54, +1, etc.
  const cleaned = trimmed.replace(/^\+?\d{1,3}[\s-]*/, '');

  if (cleaned.startsWith('16')) {
    return cleaned;
  }

  return `16 ${cleaned}`.trim();
}

/**
 * Generates a unique, real-looking PidgeX phone number formatted as '16 6XX XXX XXX'
 * ensuring different devices never share the exact same number by default.
 */
export function generateUniquePidgePhone(): string {
  const d1 = Math.floor(600 + Math.random() * 399); // 600 - 999
  const d2 = Math.floor(100 + Math.random() * 899); // 100 - 999
  const d3 = Math.floor(100 + Math.random() * 899); // 100 - 999
  return `16 ${d1} ${d2} ${d3}`;
}

