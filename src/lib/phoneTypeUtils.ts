// ============================================================
// Phone Type Utilities - Normalization & Validation
// ============================================================

/**
 * Normalize phoneType: trim whitespace, collapse multiple spaces, preserve casing
 */
export function normalizePhoneType(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate phoneType: required, min 3 chars, max 80 chars, allowed characters, must have alphanumeric
 */
export function validatePhoneType(input: string): { valid: boolean; error?: string } {
  const normalized = normalizePhoneType(input);

  // Required check
  if (!normalized) {
    return { valid: false, error: 'Phone type is required' };
  }

  // Length checks
  if (normalized.length < 3) {
    return { valid: false, error: 'Phone type must be at least 3 characters' };
  }

  if (normalized.length > 80) {
    return { valid: false, error: 'Phone type must not exceed 80 characters' };
  }

  // Allowed characters: letters, numbers, space, +, -, /, parentheses
  const allowedCharsRegex = /^[A-Za-z0-9+\-/() ]+$/;
  if (!allowedCharsRegex.test(normalized)) {
    return { valid: false, error: 'Phone type contains invalid characters' };
  }

  // Must contain at least one letter or number
  if (!/[A-Za-z0-9]/.test(normalized)) {
    return { valid: false, error: 'Phone type must contain at least one letter or number' };
  }

  return { valid: true };
}
