const KEY = 'inv_search_history';
const MAX_ENTRIES = 10;

export function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const prev = getSearchHistory().filter((h) => h.toLowerCase() !== q.toLowerCase());
    localStorage.setItem(KEY, JSON.stringify([q, ...prev].slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — silently ignore
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // silently ignore
  }
}
