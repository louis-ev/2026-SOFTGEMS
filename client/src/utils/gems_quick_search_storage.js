/** Shared across inventory + selection add-gems picker (+ other gems tables). */
export const gems_quick_search_localstorage_key = "sg_gems_quick_search";

/**
 * @returns {string}
 */
export function loadGemsQuickSearchFromStorage() {
  try {
    const stored = localStorage.getItem(gems_quick_search_localstorage_key);
    if (stored === null || stored === undefined) return "";
    return typeof stored === "string" ? stored : "";
  } catch {
    return "";
  }
}

/**
 * @param {string|null|undefined} raw
 */
export function persistGemsQuickSearchToStorage(raw) {
  try {
    const value = typeof raw === "string" ? raw : "";
    localStorage.setItem(gems_quick_search_localstorage_key, value);
  } catch {
    // Ignore storage write errors.
  }
}
