/** Scoped quick-search / column-filter memory for gems tables. */

export const gems_quick_search_localstorage_key = "sg_gems_quick_search";

export const gems_quick_search_storage_scopes = Object.freeze({
  all_gems: "all-gems",
});

const scoped_storage_key_prefix = `${gems_quick_search_localstorage_key}:`;

/**
 * @param {string|null|undefined} scope
 * @returns {string|null}
 */
export function buildGemsQuickSearchStorageKey(scope) {
  const cleaned_scope = String(scope || "").trim();
  if (!cleaned_scope) return null;
  return `${scoped_storage_key_prefix}${cleaned_scope}`;
}

/**
 * @param {string|null|undefined} scope
 * @returns {string}
 */
export function loadGemsQuickSearchFromStorage(scope) {
  const storage_key = buildGemsQuickSearchStorageKey(scope);
  if (!storage_key) return "";

  try {
    const stored = localStorage.getItem(storage_key);
    if (typeof stored === "string") return stored;

    // Legacy unscoped key → All Gems only.
    if (scope === gems_quick_search_storage_scopes.all_gems) {
      const legacy = localStorage.getItem(gems_quick_search_localstorage_key);
      return typeof legacy === "string" ? legacy : "";
    }
  } catch {
    // Ignore storage read errors.
  }
  return "";
}

/**
 * @param {string|null|undefined} scope
 * @param {string|null|undefined} raw
 */
export function persistGemsQuickSearchToStorage(scope, raw) {
  const storage_key = buildGemsQuickSearchStorageKey(scope);
  if (!storage_key) return;
  try {
    const value = typeof raw === "string" ? raw : "";
    localStorage.setItem(storage_key, value);
  } catch {
    // Ignore storage write errors.
  }
}
