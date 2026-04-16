import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with tailwind-merge and clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency value to Ethiopian Birr.
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(amount).replace('ETB', '').trim() + ' ETB';
}

/**
 * Formats a date to a human-readable string.
 */
export function formatDate(timestamp: number) {
  return new Intl.DateFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Truncates a string with ellipses.
 */
export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Generates a mock delay for simulated loading.
 */
export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Checks if an image URL is a valid storage ID or external URL.
 */
export function getProductImageUrl(imageId: string | undefined): string {
  if (!imageId) return '';
  if (imageId.startsWith('http')) return imageId;
  return `https://fastidious-schnauzer-265.convex.cloud/api/storage/${imageId}`;
}

/**
 * Calculates current stock status.
 */
export function getStockStatus(quantity: number, threshold = 2) {
  if (quantity <= 0) return { label: 'Out of Stock', color: 'text-red-500' };
  if (quantity <= threshold) return { label: 'Low Stock', color: 'text-primary' };
  return { label: `${quantity} in Stock`, color: 'text-muted' };
}
