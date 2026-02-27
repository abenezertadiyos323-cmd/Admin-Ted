const KEY = 'inv_search_history';
const MAX_ENTRIES = 10;

function safeParseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function canUseLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function getSearchHistory(): string[] {
  if (!canUseLocalStorage()) return [];
  try {
    return safeParseStringArray(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  if (!canUseLocalStorage()) return;
  try {
    const prev = getSearchHistory().filter((h) => h.toLowerCase() !== q.toLowerCase());
    localStorage.setItem(KEY, JSON.stringify([q, ...prev].slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — silently ignore
  }
}

export function clearSearchHistory(): void {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // silently ignore
  }
}
