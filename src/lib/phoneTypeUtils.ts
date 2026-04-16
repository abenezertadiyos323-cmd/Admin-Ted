/**
 * phoneTypeUtils.ts
 * Logic for extracting brand and model from phoneType strings.
 */

const BRANDS = ['iPhone', 'Samsung', 'Google', 'Xiaomi', 'Oppo', 'Vivo', 'Realme'];

/**
 * Extracts the brand from a phoneType string.
 * Example: "iPhone 15 Pro" -> "iPhone"
 */
export function extractBrand(phoneType: string): string {
  if (!phoneType) return 'Other';
  
  const normalized = phoneType.toLowerCase();
  for (const brand of BRANDS) {
    if (normalized.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  return 'Other';
}

/**
 * Extracts the model name from a phoneType string by removing the brand.
 * Example: "iPhone 15 Pro" -> "15 Pro"
 */
export function extractModel(phoneType: string): string {
  if (!phoneType) return '';
  
  const brand = extractBrand(phoneType);
  if (brand === 'Other') return phoneType;
  
  // Remove brand name (case insensitive) and trim
  const regex = new RegExp(brand, 'i');
  return phoneType.replace(regex, '').trim();
}

/**
 * Normalizes a phoneType for comparison.
 */
export function normalizePhoneType(phoneType: string): string {
  return (phoneType || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a phoneType belongs to a specific brand.
 */
export function isBrand(phoneType: string, brand: string): boolean {
  if (!phoneType) return false;
  return phoneType.toLowerCase().includes(brand.toLowerCase());
}
