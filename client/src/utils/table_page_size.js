export const gems_table_page_size_localstorage_key = "sg_gems_table_page_size";
export const selections_table_page_size_localstorage_key =
  "sg_selections_table_page_size";
export const address_book_table_page_size_localstorage_key =
  "sg_address_book_table_page_size";

/** @deprecated Legacy global key — migrated to gems on read. */
const legacy_table_page_size_localstorage_key = "sg_table_page_size";

export const table_page_size_options = [25, 50, 100, 200, 500];

export const table_page_size_default = 100;

export const table_page_size_scopes = {
  gems: gems_table_page_size_localstorage_key,
  selections: selections_table_page_size_localstorage_key,
  address_book: address_book_table_page_size_localstorage_key,
};

export function getTablePageSizeStorageKey(scope) {
  return (
    table_page_size_scopes[scope] || gems_table_page_size_localstorage_key
  );
}

export function normalizeTablePageSize(value, fallback = table_page_size_default) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  const rounded = Math.round(parsed);
  if (table_page_size_options.includes(rounded)) return rounded;
  return fallback;
}

function readStoredTablePageSize(storage_key, fallback = table_page_size_default) {
  try {
    const stored = localStorage.getItem(storage_key);
    if (stored === null || stored === "") return null;
    return normalizeTablePageSize(stored, fallback);
  } catch {
    return null;
  }
}

export function loadTablePageSize(
  scope = "gems",
  fallback = table_page_size_default
) {
  const storage_key = getTablePageSizeStorageKey(scope);
  const stored = readStoredTablePageSize(storage_key, fallback);
  if (stored !== null) return stored;

  if (scope === "gems") {
    const legacy = readStoredTablePageSize(
      legacy_table_page_size_localstorage_key,
      fallback
    );
    if (legacy !== null) {
      persistTablePageSize(legacy, "gems");
      return legacy;
    }
  }

  return fallback;
}

export function persistTablePageSize(page_size, scope = "gems") {
  try {
    localStorage.setItem(
      getTablePageSizeStorageKey(scope),
      String(normalizeTablePageSize(page_size))
    );
  } catch {
    // Ignore storage write errors.
  }
}
