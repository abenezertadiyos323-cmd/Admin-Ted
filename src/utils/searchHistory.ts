/**
 * searchHistory.ts
 * Manages the local storage for the inventory search bar history.
 */

const HISTORY_KEY = 'admin_search_history';
const MAX_HISTORY = 8;

export const getSearchHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const addToSearchHistory = (term: string) => {
  if (!term || term.trim().length <= 1) return;
  
  const history = getSearchHistory();
  const normalized = term.trim();
  
  // Remove existing occurrence of the same term (case-insensitive)
  const filtered = history.filter(h => h.toLowerCase() !== normalized.toLowerCase());
  
  // Prepend new term and limit size
  const newHistory = [normalized, ...filtered].slice(0, MAX_HISTORY);
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

export const clearSearchHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const removeFromSearchHistory = (term: string) => {
  const history = getSearchHistory();
  const newHistory = history.filter(h => h !== term);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};
