/**
 * Utility functions to guarantee all phone numbers in MessengerPidgeon start with '16'.
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
