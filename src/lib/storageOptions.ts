export const PHONE_STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'] as const;

export const PHONE_STORAGE_FILTER_OPTIONS = [
  { label: '32GB', value: 32 },
  { label: '64GB', value: 64 },
  { label: '128GB', value: 128 },
  { label: '256GB', value: 256 },
  { label: '512GB', value: 512 },
  { label: '1TB', value: 1024 },
];

export const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB', '24GB'] as const;

export const CONDITION_OPTIONS = [
  'New',
  'Like New',
  'Excellent',
  'Good',
  'Fair',
  'Poor',
] as const;

export function getStorageValue(storage: string): number {
  const numeric = parseInt(storage, 10);
  if (isNaN(numeric)) return 0;
  if (storage.toUpperCase().includes('TB')) return numeric * 1024;
  return numeric;
}

export function formatStorage(gb: number): string {
  if (gb >= 1024) return `${gb / 1024}TB`;
  return `${gb}GB`;
}
