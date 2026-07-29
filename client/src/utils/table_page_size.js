export const table_page_size_localstorage_key = "sg_table_page_size";

export const table_page_size_options = [25, 50, 100, 200, 500];

export const table_page_size_default = 100;

export function normalizeTablePageSize(value, fallback = table_page_size_default) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  const rounded = Math.round(parsed);
  if (table_page_size_options.includes(rounded)) return rounded;
  return fallback;
}

export function loadTablePageSize(fallback = table_page_size_default) {
  try {
    const stored = localStorage.getItem(table_page_size_localstorage_key);
    if (stored === null || stored === "") return fallback;
    return normalizeTablePageSize(stored, fallback);
  } catch {
    return fallback;
  }
}

export function persistTablePageSize(page_size) {
  try {
    localStorage.setItem(
      table_page_size_localstorage_key,
      String(normalizeTablePageSize(page_size))
    );
  } catch {
    // Ignore storage write errors.
  }
}
